# SS14 Jerry Auth
This tool provides easy-to-use interface to connect discord account with Space Station 14 account.

> [!NOTE]
> As this tool was developed for S.T.A.L.K.E.R 14 purposes I've included given table, so we could process some sponsor stuff like sponsor crates, etc.

## Technical Details
As I said before, this app was developed for S.T.A.L.K.E.R 14 in Space Station, so it have given table you may not need, but it allows to manage some giving stuff inside game once a long time. Like with wipe system.

This app also supports(of course it is) token refreshing, it checks if token valid every time you make a request, so you can be sure your request will be succeeded.

## Routes
1. **Generate Link**
    - `GET /api/link`
    - **Description:** Generates auth link for user.
    
   **Query Parameters:**

   | Name      | Type   | Required | Description                                            |
   |-----------|--------|----------|--------------------------------------------------------|
   | userid    | string | Yes      | state parameter for future link, should be SS14 UserId |
   | api_token | string | Yes      | Api Token of the app for security                      |
   
    **Response:**  
   Status Code: OK(200)
   ```json
    {
      "link": "LINKHERE"
    }
    ```

3. **Get Roles**
    - `GET /api/roles`
    - **Description:** Returns user roles on specific guild
    
    - **Query Parameters:**
      
      | Name      | Type   | Required | Description                                 |
      |-----------|--------|----------|---------------------------------------------|
      | userid    | string | Yes      | SS14 UserId of the player to get roles from |
      | guildid   | string | Yes      | Discord GuildId to get roles from           |
      | api_token | string | Yes      | Api Token of the app for security           |
   **Response:**  
    Status Code: OK(200)
    ```json
    {
      "roles": ["role1", "role2"]
    }
    ```

4. **Check Auth**
    - `GET /api/check`
    - **Description:** Checks if specific user is authenticated
    - **Query Parameters:**

      | Name      | Type   | Required | Description                        |
      |-----------|--------|----------|------------------------------------|
      | userid    | string | Yes      | SS14 UserId of the player to check |
      | api_token | string | Yes      | Api Token of the app for security  |
    **Response:**  
    Status Code: OK(200) | NotFound(404) - Depending on the result

5. **User retrieve**
    - `GET /api/user`
    - **Description:** Retrieves user from database by netUserId or by discordIdd
    - **Query Parameters:**
      
      | Name      | Type   | Required | Description                       |
      |-----------|--------|----------|-----------------------------------|
      | id        | string | Yes      | Id of the player to check         |
      | api_token | string | Yes      | Api Token of the app for security | 
      | method    | string | Yes      | SS14 or Discord method of Id      | 

6. **Is Given**
   - `GET /api/is_given`
   - **Description:** Checks if given flag is set to 1
   - **Query Parameters:**

     | Name      | Type   | Required | Description                                                 |
     |-----------|--------|----------|-------------------------------------------------------------|
     | userid    | string | Yes      | SS14 UserId of the player to check                          |
     | api_token | string | Yes      | Api Token of the app for security                           |
     | method    | string | Yes      | SS14 or Discord, influence on what id server is waiting for |
   **Response:**  
   Status Code: OK(200) | No Content(204) - Depending on the result


7. **Set Given**
    - `POST /api/given`
    - **Description:** Sets given flag
      - **Query Parameters:**

        | Name      | Type    | Required | Description                                                 |
        |-----------|---------|----------|-------------------------------------------------------------|
        | userid    | string  | Yes      | SS14 UserId of the player to check                          |
        | api_token | string  | Yes      | Api Token of the app for security                           |
        | method    | string  | Yes      | SS14 or Discord, influence on what id server is waiting for |
        | given     | integer | Yes      | Flag itself, between 0 and 1                                |
   **Response:**  
   Status Code: OK(200)

   
8. **Wipe Given**
    - `POST /api/wipe_given`
    - **Description:** Sets all given flags to 0, for all users
    - **Query Parameters:**

      | Name      | Type    | Required | Description                        |
      |-----------|---------|----------|------------------------------------|
      | api_token | string  | Yes      | Api Token of the app for security  |
   **Response:**  
   Status Code: OK(200)

9. **Deletion**
    - `POST /api/delete`
    - **Description:** Should be self-explanatory, but this route is turned off by default, set `DELETION_ALLOWED` in .env file to enable it.
    - **Query Parameters:**
   
      | Name      | Type   | Required | Description                       |
      |-----------|--------|----------|-----------------------------------|
      | id        | string | Yes      | Id depending on method field      |
      | method    | string | Yes      | SS14 or Discord(ss14/discord)     |
      | api_token | string | Yes      | Api Token of the app for security |
    **Response:**
    Status Code: OK(200)
    ```json
    {
      "response": "OK"
    }
    ```
    
        
## Internal Routes
1. **Callback Route**
    - `GET /auth/callback`
    - **Description:** Internal route to process auth for users. Add this route for your discord application in callback field.
   - **Query Parameters:**
     
     | Name      | Type   | Required | Description                                         |
     |-----------|--------|----------|-----------------------------------------------------|
     | state     | string | Yes      | To be decoded from base64 and represented as userid |
     | code      | string | Yes      | Discord code to exchange                            |

## Docker Support
This app also supports docker, to set it up you just need to clone this repository and build this image by yourself using:
```bash
git checkout dockerize # docker support is on other branch
docker build -t ssj_auth .
```
or pull already built one with:
```bash
docker pull jerryimmouse/ssj_auth
```

Then you'll need to run this image with the following template:
```dotenv
CLIENT_API_PORT=2424

NODE_ENV=production

API_KEY=TOKEN
DISCORD_API_ENDPOINT=https://discord.com/api/v10
CLIENT_ID=CLIENTID
CLIENT_SECRET=CLIENT_SECRET
REDIRECT_URI=http://127.0.0.1:2424/auth/callback
DISCORD_AUTH_LINK_TEMPLATE=https://discord.com/oauth2/authorize

USE_GIVEN=0
USE_CACHE=1
CACHE_MAX_SIZE=100
CACHE_UPDATE_TIMEOUT=3600
IS_IN_GUILD=1
GUILD_ID=GUILD_ID

DELETION_ALLOWED=0 # 0/1
```

Also you'd like to expose database file via
```bash
docker run -v /path/on/hostMachine/:/usr/src/ssj/assets/ jerryimmouse/ssj_auth
```
This command will create a symlink to assets folder of the container to `hostMachine` folder

The full command to run this image can be like this
```bash
docker run \
  --name ssj \
  -d \
  -p 2424:2424 \
  -v ./docker-files:/usr/src/ssj/assets \
  --env-file .env \
  jerryimmouse/ssj_auth
```

## Deploying
> [!IMPORTANT]  
> This app was designed for being behind some reverse proxy like nginx or Apache2. I haven't tested it in other environments.

```shell
git clone https://github.com/JerryImMouse/ssj_auth.git
cd ssj_auth
npm install
mv .env-template .env
nano .env # make some changes so it would be applicable to you, all fields should be self-explanatory
node app.js # probably should setup some daemon for it
```

## Roadmap

- **Performance Improvements:**
    - Add indexes to the database to enhance lookup speed.
    - Optimize the `/api/check` route (considering indexes as a potential solution).

- **Database Support:**
    - Add support for additional database types.

- **Feature Enhancements:**
    - Introduce more routes for handling interactions with the Discord API within the game.
