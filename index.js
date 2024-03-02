// import packages
const express = require("express");
const pg = require("pg");
const app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream_shop_db"
);

// static routes here (you only need these for deployment)
app.use(express.static(path.join(__dirname, "../client/dist")));
// app routes here
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);

// parse the body into JS Objects
app.use(express.json());
// Log the requests as they come in
app.use(require("morgan")("dev"));

// Read Flavors - R
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * FROM flavors ORDER BY created_at DESC;
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

// Read Single Flavor - R
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        SELECT * FROM flavors
        WHERE id=$1
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// CREATE Flavors - C
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO flavors (name)
            VALUES($1)
            RETURNING *
        `;
    const response = await client.query(SQL, [req.body.name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE Flavors - D
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        DELETE FROM flavors
        WHERE id=$1
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// Update Flavors - U
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
        UPDATE flavors
        SET name=$1, updated_at=now()
        WHERE id=$2 RETURNING *
        `;
    const response = await client.query(SQL, [req.body.name, req.params.id]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// create init function
const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(25),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
    `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
        INSERT INTO flavors (name) VALUES('Chocolate');
        INSERT INTO flavors (name) VALUES('Vanilla');
        INSERT INTO flavors (name, is_favorite) VALUES('Cookies & Cream', true);
        INSERT INTO flavors (name) VALUES('Strawberry');
        INSERT INTO flavors (name, is_favorite) VALUES('Caramel', true);
  `;
  await client.query(SQL);
  console.log("data seeded");
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`listening on port ${PORT}`));
};

// init function invocation
init();
