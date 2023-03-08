import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { logger, safeLoadJSON, sleep, writeJSON } from './utils.js';

dotenv.config();

const ratingsPath = process.env.IMDB_ST_RATINGS_PATH;
const statePath = process.env.IMDB_ST_SYNC_STATE_PATH;
const sleepMs = Number.parseInt(process.env.IMDB_ST_SLEEP_MS) ?? 2000;

const url = process.env.IMDB_GQL_API;
const cookie = process.env.IMDB_COOKIE;
const amazonSessionId = process.env.IMDB_X_AMAZON_SESSIONID;
const clientRid = process.env.IMDB_X_IMDB_CLIENT_RID;

export async function sync() {
    let count = 0;
    const ratings = await safeLoadJSON(ratingsPath);
    const state = await safeLoadJSON(statePath) || {
        ratings: { idsDone: [] },
    };

    try {
        for (const rating of ratings) {
            if(state.ratings?.idsDone?.includes(rating.imdbMovieId)) {
                logger.info('Skipping', rating.imdbMovieId);
                ++count;
                continue;
            }
            await rate(rating.imdbMovieId, rating.userRatingScore)
            state.ratings.idsDone.push(rating.imdbMovieId);
            logger.info(`Progress: ${++count}/${ratings.length} is done.`)
            await sleep(sleepMs);
        }
    } catch (error) {
        logger.error('Error while syncing ratings', JSON.stringify(error));
        await writeJSON(state, statePath);
    }

    return true;
}

async function rate(titleId, rating) {
    const body = {
        query: `mutation UpdateTitleRating($rating: Int!, $titleId: ID!) {
            rateTitle(input: {
                rating: $rating,
                titleId: $titleId
            }) {
                rating {
                    value  __typename
                }
                __typename
            }
        }`,
        operationName: "UpdateTitleRating",
        variables: {
            rating,
            titleId,
        }
    }

    const resp = await fetch(url, {
        headers: {
            "accept": "application/graphql+json, application/json",
            "accept-language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"Google Chrome\";v=\"110\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-amzn-sessionid": amazonSessionId,
            "x-imdb-client-name": "imdb-web-next",
            "x-imdb-client-rid": clientRid,
            "x-imdb-user-country": "HU",
            "x-imdb-user-language": "hu-HU",
            "x-imdb-weblab-treatment-overrides": "{\"IMDB_DESKTOP_SEARCH_ALGORITHM_UPDATES_577300\":\"T1\"}",
            cookie,
            "Referer": "https://www.imdb.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        referrer: "https://www.imdb.com/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: JSON.stringify(body),
        method: "POST",
        mode: "cors",
        credentials: "include"
    });

    const jsonResp = await resp.json();
    const success = !!jsonResp.data?.rateTitle?.rating;
    if (!success) throw jsonResp.errors;
    logger.info(`Done with: ${titleId}`, jsonResp.data.rateTitle.rating);
}
