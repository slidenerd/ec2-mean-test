Goal
- Use express generator
- Add Mongo DB CRUD generator as per https://medium.com/@bvodola/crud-routes-generator-with-node-express-js-mongoose-30a16538e16a
- Add PM2 ecosystem file to test a dummy development and production environment
- Enable DEBUG on development environment
- Upload to Amazon EC2
- Run

Working
- Open http://127.0.0.1:3000 to launch the express website
- Send a POST request to http://127.0.0.1:3000/api/jokes to add a new Joke to the MongoDB database
- Send a GET request to http://127.0.0.1:3000/api/jokes to get all the added Jokes
- Send a GET request to http://127.0.0.1:3000/api/jokes/:id with a specific id of a joke obtained from MongoDB database to query a single joke