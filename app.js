const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { request } = require("http");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

function arraySnaketoCamel(item) {
  return {
    stateId: item.state_id,
    stateName: item.state_name,
    population: item.population,
  };
}

function districtSnakeToCamel(item) {
  return {
    districtId: item.district_id,
    districtName: item.district_name,
    stateId: item.state_id,
    cases: item.cases,
    cured: item.cured,
    active: item.active,
    deaths: item.deaths,
  };
}

function stateNameFunc(item) {
  return {
    stateName: item.state_name,
  };
}

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1023, () => {
      console.log("Server is running at http://localhost:1023");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
};

initializeDBAndServer();

// API 1

app.get("/states/", async (request, response) => {
  const getAllStateQuery = `
    SELECT *
    FROM state;`;
  const stateArray = await db.all(getAllStateQuery);
  console.log(stateArray);
  const op = stateArray.map((eachItem) => arraySnaketoCamel(eachItem));
  response.send(op);
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateByStateIdQuesry = `
  SELECT *
  FROM state
  WHERE state_id = ${stateId};`;
  const stateIdArray = await db.get(stateByStateIdQuesry);
  console.log(stateIdArray);
  const op = arraySnaketoCamel(stateIdArray);
  response.send(op);
});

// API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } =
    districtDetails;

  const postDistrictQuery = `
    INSERT INTO district
    (district_name, state_id, cases, cured, active, deaths)
    VALUES( '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `
  SELECT * 
  FROM district
  WHERE district_id = ${districtId};`;
  const district = await db.get(getDistrictByIdQuery);
  const op = districtSnakeToCamel(district);
  response.send(op);
});

// API 5

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district 
    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } =
    districtDetails;

  const updateDistrictDetailsQuery = `
    UPDATE district
    SET district_name = '${districtName}', 
    state_id = ${stateId},
    cases = ${cases}, 
    cured = ${cured}, 
    active = ${active}, 
    deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrictDetailsQuery);
  response.send("District Details Updated");
});

// API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const stateStatQuery = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM
      district

  WHERE state_id = ${stateId};`;

  const totalCasesByState = await db.all(stateStatQuery);
  console.log(totalCasesByState);
  response.send(totalCasesByState);
});

// API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
  SELECT  state_id 
  FROM district
  WHERE district_id = ${districtId};`;

  const stateId = await db.get(getStateIdQuery);
  console.log(stateId);
  const state = stateId.state_id;
  const stateNameQuery = `
  SELECT state_name 
  FROM state
  WHERE state_id = ${state}`;

  const stateName = await db.get(stateNameQuery);
  //   console.log(stateName);
  const op = stateNameFunc(stateName);
  response.send(op);
});

module.exports = app;
