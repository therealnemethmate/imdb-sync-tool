import fetch from 'node-fetch';
import { env } from 'process';
import * as dotenv from 'dotenv';
import { logger, safeLoadJSON, sleep, writeJSON } from './utils.js';

dotenv.config();

const ratingsPath = env.IMDB_ST_RATINGS_PATH;
const statePath = env.IMDB_ST_SYNC_STATE_PATH;
const sleepMs = Number.parseInt(env.IMDB_ST_SLEEP_MS) ?? 2000;

const url = env.IMDB_GQL_API;
const cookie = env.IMDB_COOKIE;

export async function sync() {
    let count = 0;
    const ratings = await safeLoadJSON(ratingsPath);
    let state = await safeLoadJSON(statePath);
    if (!state?.ratings?.idsDone) state = { ratings: { idsDone: [] } };
    try {
        for (const rating of ratings) {
            if(state.ratings?.idsDone?.includes(rating.imdbMovieId)) {
                logger.info('Skipping', rating.imdbMovieId);
                ++count;
                continue;
            }
            await rate(rating.imdbMovieId, rating.userRatingScore);
            state.ratings.idsDone.push(rating.imdbMovieId);
            logger.info(`Progress: ${++count}/${ratings.length} is done.`);
            await sleep(sleepMs);
        }
    } catch (error) {
        logger.error('Error while syncing ratings', error);
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
        operationName: 'UpdateTitleRating',
        variables: {
            rating,
            titleId,
        }
    };

    const resp = await fetch(url, {
        headers: {
            accept: 'application/graphql+json, application/json',
            'content-type': 'application/json',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            cookie,
            Referer: 'https://www.imdb.com/',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        referrer: 'https://www.imdb.com/',
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: JSON.stringify(body),
        method: 'POST',
        mode: 'cors',
        credentials: 'include'
    });

    const jsonResp = await resp.json();
    const success = !!jsonResp.data?.rateTitle?.rating;
    if (!success) throw jsonResp.errors;
    logger.info(`Done with: ${titleId}`, jsonResp.data.rateTitle.rating);
}
