# Title: politics application Backend 

A client based project, going to beild to fetch the history of the social media posts.
As to we post someting on facebook or on youtube. we have to track the it.

## Working flow
1: Uploading a csv file containg the data of post e.g. Yt and Fb links, channels. 
2. Sheet is going to parse and read row by row.
3. going to chech the duplicates with database, if there is any dupliocate it        simply ignore that data. and store the non-duplicate data in the database.
4. update the previous data so that we can track our previus data status.
API: /upload-csv

5. getting the data datewise   :- API: # /daily-views
6. exporting all data, having the filter and pagination

## How to Start Server 
npm start



// to show the complete data on dashboard beild 3 api all-ytdata, all-fbdata and all-podata.