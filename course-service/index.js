require('dotenv').config();
const express = require('express');
const app = express();
const db = require('./models');
const port = process.env.PORT || 3002;
const fs = require('fs');
// const yaml = require('yaml');
const cors = require("cors");
const { graphqlHTTP } = require("express-graphql");

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
async function testDbConnection() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}
testDbConnection();

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

// Start server
app.listen(port, () => {
    console.log(`🚀 Server started on http://localhost:${port}`);
});