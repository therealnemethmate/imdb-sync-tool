# Node.js IMDb Movie Rating Sync
This is a simple Node.js application that synchronizes movie ratings from a JSON file to your IMDb account.

## Prerequisites
To use this application, you will need the following:

- Node.js installed on your computer. You can download it from the official Node.js website: https://nodejs.org/.
- An IMDb account.
- A JSON file containing movie ratings in the following format:
```json
{
  "imdbMovieId": "tt1001526",
  "userRatingScore": 7
}
```

## Getting started
To get started, follow these steps:

1. Clone the repository to your local machine.

2. Install the required dependencies by running the following command:

    $ npm install

3. Create a .env file in the root directory of the project and add the following environment variables:

```conf
IMDB_COOKIE=<copy from browser>
IMDB_X_AMAZON_SESSIONID=<copy from browser>
IMDB_X_IMDB_CLIENT_RID=<copy from browser>
```
4. You can get these values by inspecting the cookies in your browser while logged in to your IMDb account.

5. Put your movie ratings in a JSON file with the name ratings.json in the root directory of the project.

6. Run the application by running the following command:

    $ npm start


The application will read the `ratings.json` file and synchronize the ratings to your IMDb account.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

