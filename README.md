Features

- list of all moddable objects and their tags
  <!-- - option to randomize mods -->
  <!-- - export/create collection -->
- highlight missing

Downloading workshop data
python -u "c:\Users\Jah.DESKTOP-JK06E9D\.vscode\programs\LFD2-manager\script.py"

## ISSUES

Should the package.json in website be merged with the one in the outer directory?

# Running

## Starting Server

Data must first be loaded to the server, you can convert the downloaded files to the database using `node import-json-to-db.js`

Navigate to the server directory using
`cd db`

We are storing are JSON files in MongoDB
Once the data is loaded, we can start the MongoDB server using
`npm run start`

## Starting frontend

Navigate to the sites directory using
`cd website`

`npm start`

! You will likely be prompted if you want to start on a different port. This is because the server is hardcoded to be to port 3000. You must say "Y" for the site to work.
