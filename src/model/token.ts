//type imports
import { Token } from "../types";
import { QueryResult } from "pg";
//other external imports
import { v4 as uuidv4, validate as uuidvalidate } from "uuid";
//internal imports
import { pool } from "..";

//Token table
const createTokensTableQuery: string = "CREATE TABLE IF NOT EXISTS tokens (token CHAR(32) PRIMARY KEY, owner CHAR(64) NOT NULL)";
const getTokensQuery: string = 'SELECT * FROM tokens';
const getTokenByTokenQuery: string = 'SELECT * FROM tokens WHERE token=$1';
const addTokenQuery: string = "INSERT INTO tokens (token, owner) VALUES ($1, $2)";
const deleteTokenQuery: string = "DELETE FROM tokens WHERE token=$1";

export function createTokensTable(): Promise<QueryResult<any>> {
    return pool.query(createTokensTableQuery);
}

export function getTokens(): Promise<Array<Token>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getTokensQuery);

            let tokens: Array<Token> = res.rows;

            tokens.forEach(token => {
                token.owner = token.owner.trim()
            })

            return resolve(tokens);
        } catch(err) {
            return reject(err);
        }
    });
}

export function getTokenByToken(token: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        try {
            //Check if token is defined
            if (token === undefined) {
                return reject("token is undefined");
            }
            //check if token is valid uuid
            if (!checkTokenValidity(token)) {
                return reject("not a valid token");
            }

            let res = await pool.query(getTokenByTokenQuery, [token]);

            //If there is no token object, return nothing
            if (!res.rows) {
                return reject("no token object with this token found");
            }

            //Return token object
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export function addToken(owner: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        let token: string = uuidv4().trim().split('-').join('');
        
        try {
            let res: QueryResult = await pool.query(addTokenQuery, [token, owner]);
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

export function deleteToken(token: Token): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Check if token is defined
        if (token === undefined) {
            return reject("token is undefined");
        }
        //check if token is valid uuid
        if (!checkTokenValidity(token.token)) {
            return reject("not a valid token");
        }

        try {
            await pool.query(deleteTokenQuery, [token.token]);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

function checkTokenValidity(token: string) {
    //Check length
    if (token.length != 32) {
        return false;
    }

    //Create uuid from token
    let uuid: string = token.slice(0, 8) + "-" + token.slice(8, 12)
                        + "-" + token.slice(12, 16) + "-" + token.slice(16, 20)
                        + "-" + token.slice(20, 32);
    //check if valid uuid
    return uuidvalidate(uuid);
}