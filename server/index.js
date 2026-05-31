import express from 'express'
import cors from 'cors';
import fs from 'node:fs';

const app = express();

app.use(cors());
app.use(express.json() );

// app.get('/', (req, res) => {
//   res.send({"ok": "rendered"});
// })

/*
include <terrain.scad>;

heights = [ 1,2,3,4 ];

hexTerrain( heights, 2 );
*/

app.post('/', (req, res) => {
    console.log('req ok', req.body);
    const text = "include <terrain.scad>;\nheights = [" + req.body.heights.join(',') + " ];\nhexTerrain( heights, " + req.body.sideLen + ", -1 );\n";
    try {
        fs.writeFileSync('/home/ikm/git/openscad/hextrain.scad', text );
        // file written successfully
    } catch (err) {
        console.error(err);
    }
    res.send({ "rc": "posted" });
})

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001')
})
