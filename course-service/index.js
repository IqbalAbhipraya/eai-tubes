require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./models');
const port = process.env.PORT || 4002;
const fs = require('fs');
// const yaml = require('yaml');
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Student Service API',
        endpoints: {
            graphql: '/graphql',
        }
    });
});

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: resolvers, 
    graphiql: true,
    customFormatErrorFn: (error) => {
        console.error('GraphQL Error:', error.message);
        return {
            message: error.message,
            locations: error.locations,
            path: error.path,
        };
    }
}));

db.sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Database synced successfully');

        app.listen(port, () => {
            console.log(`🚀 Server started on http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('❌ Unable to start server:', error);
        process.exit(1); // stop container if DB fails
    });