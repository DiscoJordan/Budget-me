# Budget-me

Budget-me is a personal finance management application designed to help users track their income, expenses, and savings goals. This project includes both client and server components built with JavaScript.

## Features

- Track income and expenses
- Set and monitor savings goals
- Generate financial reports and summaries
- User authentication and profile management

## Installation

To get started with Budget-me, follow these steps:

### Prerequisites

- Node.js
- npm (Node Package Manager)

### Clone the Repository

```bash
git clone https://github.com/DiscoJordan/Budget-me.git
cd Budget-me
```
### In `./client`, create `.env` file with following variables :

   - EXPO_PUBLIC_JWT_SECRET (Secret)

### In `./client/config.js`, paste in URL your wifi connection IP:
```bash
   const URL = `http://(paste ip of WIFI Network here):5050`;
```

### Run `npm i` from `./client` and `./server` folders to install all dependencies:
   ```bash
   cd server
   npm i
   cd ..
   cd client
   npm i
```
- Run `./client` with `npm start` and `./server` with `nodemon`
