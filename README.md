# simple-azure-ad-deamon
Azure AD deamon for my apps

## Workflow
- User enter this service ('/')
- This service redirect to MS login page
- MS redirect to this service ('/redirect') with MS login info
- This service use the login info to mint new token
- Response the token to the client

## How to use

- Clone this
- `npm i`
- Copy `.env.example` and rename it to `.env`
- Set configs in `.env`
- `npm run start`


