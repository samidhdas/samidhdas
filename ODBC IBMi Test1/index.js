const odbc = require('odbc');

// can only use await keyword in an async function
async function example() {
	// const connection = await odbc.connect(`Driver=IBM i Access ODBC Driver;System=MYSYSTEM;UID=LALLAN;Password=passwordhere`);
	const connection = await odbc.connect(`Driver=iSeries Access ODBC Driver;System=TOTOPROD;UID=SAMIDHD;Password=TOTO3270`);
	const result = await connection.query('SELECT * FROM QIWS.QCUSTCDT');
	console.log(result);
}

example();