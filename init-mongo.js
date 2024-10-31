// Switch to the `discordBotDB` database
db = db.getSiblingDB('discordBotDB');

// Create the user `devUser` with the password `devPassword`
// and assign the `readWrite` role for `discordBotDB`
db.createUser({
  user: "Admin",
  pwd: "adminPassword",
  roles: [
    {
      role: "readWrite",
      db: "discordBotDB"
    }
  ]
});

// Optionally, you can create initial collections
db.createCollection('conversations');

