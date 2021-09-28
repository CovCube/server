//type imports
import { Token } from "../types";
import { QueryResult } from "pg";
//other external imports
import { v4 as uuidv4 } from "uuid";
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
    return new Promise((resolve, reject) => {
        pool.query(getTokensQuery)
            .then((res: QueryResult) => {
                let tokens: Array<Token> = res.rows;

                tokens.forEach(token => {
                    token.owner = token.owner.trim()
                })

                resolve(tokens);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getTokenByToken(token: string): Promise<null | Token> {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await pool.query(getTokenByTokenQuery, [token]);

            //If there is no token object, return nothing
            if (!res.rows) {
                resolve(null);
            }

            //Return token object
            resolve(res.rows[0]);
        } catch(err) {
            reject(err);
        }
    });
}

export function addToken(owner: string): Promise<Token> {
    return new Promise(async (resolve, reject) => {
        let token: string = uuidv4().trim().split('-').join('');
        
        pool.query(addTokenQuery, [token, owner])
            .then((res: QueryResult) => {
                console.log(res.rows);
                resolve(res.rows[0]);
            })
            .catch((err: Error)=> {
                reject(err);
            });
    });
}

export function deleteToken(token: Token): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(deleteTokenQuery, [token.token])
            .then((res: QueryResult) => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}