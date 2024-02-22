#!/usr/bin/env node
import figlet from 'figlet';
import chalk from 'chalk';
import axios from 'axios';
import fs from 'fs';
import Ajv from 'ajv';
import * as yaml from 'js-yaml';
import { rimraf } from 'rimraf';
import path from 'path';
import { fileURLToPath } from 'url';


let userZ = '';
let passwordZ = '';

const main = async () => {
  // ###########################################################################
  // Welcome
  // ###########################################################################
  //console.log('zInit   by   zDevOps');
  //console.log(figlet.textSync("Hello World!", "Standard"));
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  console.log(`Directory name is ${__dirname}`); 
  let data = fs.readFileSync(__dirname + "/Standard.flf", "utf8");
  figlet.parseFont("myfont", data);
  console.log(figlet.textSync("zInit  by  zDevOps !", "myfont"));
  /*
  await figlet("zInit   by   zDevOps",{}, function (err, data) {
    if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
    }
    console.log(chalk.yellow(data));
    console.log('');
  });
  */


  // ###########################################################################
  // Lecture du fichier zInitFile.yaml
  // ###########################################################################
  // define a function to read utf8 files
  console.log('Lecture du fichier zInitFile.yaml');
  const readUtf8 = (file) => fs.readFileSync(file, 'utf8');

  // convert input yaml file to json
  const config = yaml.load(readUtf8("./zTools/conf/zInitFile.yaml"));

  let source = config.configuration.source;
  let typeSource = '';
  let destination = config.configuration.destination;
  let baseDirectory = config.configuration.baseDirectory;
  let clearBefore = config.configuration.clearBefore;
  let hosts = config.hosts;
  let url = '';
  let transferts = config.transferts;
  for (let host in hosts) {
    if (hosts[host].name === source) {
      if (hosts[host].type === 'zos')
      url = hosts[host].url;
      typeSource = 'zos';
    }
  }
  console.log('Done');

  // ###########################################################################
  // Demande du user/password de connexion mainframe
  // ###########################################################################
  if (userZ === '' || userZ === undefined) {
    //let userTMP = await input({ message: 'Enter your mainframe ID : ' });
    userZ = process.argv[2];
    userZ = userZ.toUpperCase();
//    console.log("userZ : " + userZ);
  }
  if (passwordZ === '' || passwordZ === undefined) {
    passwordZ = process.argv[3];
//    console.log("passwordZ : " + passwordZ);
  }

  // ###########################################################################
  // Suppression contenu repertoire
  // ###########################################################################
  if (clearBefore) {
    try {
      
        console.log('Suppression du répertoire ' + baseDirectory);
        rimraf.windows.sync(baseDirectory);
    }
    catch (err) {
      console.log('Impossible de supprimer le répertoire ' + baseDirectory);
      console.log('Ressource occupée ou vérouillée.');
    }
    finally {
      console.log('Done');
    }
  }

  let suite = true;
  const ajv = new Ajv();
  
  // ###########################################################################
  // Boucle de transferts
  // ###########################################################################
  if (suite) {
    console.log('Transferts');
    for (let transfert in transferts) {
      if (typeSource === 'zos') {
        let name = transferts[transfert].name;
        let PDS = transferts[transfert].source;
        let filter = transferts[transfert].filter;
        let destination = transferts[transfert].destination;
        let extension = transferts[transfert].extensionFile;
        let filesExluded = transferts[transfert].exclude;
        let filesIncluded = transferts[transfert].include;

        if (filter === undefined) filter = ''
        
        // current timestamp in milliseconds
        let ts = Date.now();

        let date_ob = new Date(ts);
        let date = date_ob.getDate();
        let month = date_ob.getMonth() + 1;
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let milliseconds = date_ob.getMilliseconds();
      
        console.log('==' + year + "-" + month + "-" + date+ "-" + hours + ":" + minutes+ ":" + seconds + milliseconds + ' Transfert ' + name + ', PDS source : ' + PDS);
          await axios.get('https://'+url+':7554/ibmzosmf/api/v1/zosmf/restfiles/ds/'+PDS+'/member?pattern='+filter, {
        //await axios.get('https://'+url+':20443/zosmf/restfiles/ds/'+PDS+'/member?pattern='+filter, {
          auth: {
            username: userZ,
            password: passwordZ 
          }
        })
        .then(function (response) {
          // en cas de réussite de la requête
          let members = [];

          if (filesIncluded !== undefined) {
            for (let file in filesIncluded) {
              members.push(filesIncluded[file]);
            }
          }
          if (filesExluded !== undefined) {
            let items = response.data.items;
            for (let item in items) {
              members.push(items[item].member);
            }
            for (let exclude in filesExluded) {
              let myIndex = members.indexOf(filesExluded[exclude]);
              if (myIndex !== -1) {
                members.splice(myIndex, 1);
              }
            }
          }


          if (!fs.existsSync(baseDirectory + '/' + destination)){
            fs.mkdirSync(baseDirectory + '/' + destination, { recursive: true });
          }

          for (let member in members) {
              console.log('  Récupération et écriture en local du membre : '+members[member]);
                axios.get('https://'+url+':7554/ibmzosmf/api/v1/zosmf/restfiles/ds/'+PDS+'(' + members[member] + ')', {
                //axios.get('https://'+url+':20443/zosmf/restfiles/ds/'+PDS+'(' + members[member] + ')', {
                  auth: {
                    username: userZ,
                    password: passwordZ 
                  }
                })
                .then(function (response) {
                  // en cas de réussite de la requête
                  fs.writeFileSync(baseDirectory + '/' + destination + '/' + members[member] + extension, response.data);
                })
                .catch(function (error) {
                  // en cas d’échec de la requête
                  console.log(error);
                })
                .finally(function () {
                  // dans tous les cas
                });      
          }
          // current timestamp in milliseconds
          let ts = Date.now();

          let date_ob = new Date(ts);
          let date = date_ob.getDate();
          let month = date_ob.getMonth() + 1;
          let year = date_ob.getFullYear();
          let hours = date_ob.getHours();
          let minutes = date_ob.getMinutes();
          let seconds = date_ob.getSeconds();
          let milliseconds = date_ob.getMilliseconds();
    
          console.log('==' + year + "-" + month + "-" + date+ "-" + hours + ":" + minutes+ ":" + seconds + milliseconds + ' Done');
        })
        .catch(function (error) {
          // en cas d’échec de la requête
          console.log(error);
        })
        .finally(function () {
          // dans tous les cas
        });
      }
    }  
    // current timestamp in milliseconds
    let ts = Date.now();

    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let milliseconds = date_ob.getMilliseconds();
    
    console.log(year + "-" + month + "-" + date+ "-" + hours + ":" + minutes+ ":" + seconds + milliseconds + ' Done');
  }


}

// Call the main function
main();
