FTaskRunner
=========== 

[![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](https://github.com/javadparvaresh/FTaskRunner/blob/master/LICENSE)
[![Latest Stable Version](http://img.shields.io/github/release/tedious/JShrink.svg)](https://github.com/javadparvaresh/FTaskRunner)
[![Total Downloads](https://img.shields.io/github/downloads/javadparvaresh/FtaskRunner/total.svg)](https://github.com/javadparvaresh/FTaskRunner)


FTaskRunner is a nodejs library that lets you to create a flunet way tasks and execute them asynchronous.


## Installation
```shell
    npm install FtaskRunner
```


## Usage

###Creating a simple process

```javascript
var ftask=require("ftaskrunner");
ftask.build("helloWorld"function(root){
    
    root.for(1,5).print();
    
}).run(function(result){
    
    console.log("process completed");
    console.log("\t result:" + result.helloWorld.result[0]);
    
})
```
> Result :
```shell
1
2
3
4
5
process completed
result: [1,2,3,4,5]
```

### an other advance one


```javascript
var ftask=require("ftaskrunner");
var ftaskMysql=require("ftaskrunner-mysql");

ftask.load(ftaskMysql).build("helloWorld"function(root){
    
    root
        .for(1,5)  // load a loop from 1 to 5 
        .custom(function(scope,next){ // create query based on loop
            next("SELECT * FROM TABLE where i>" + scope.$$input);
        })
        .mysqlQuery({ host:127.0.0.1,user:'sa',pass:'sa' }) // executes the query
        .foreach() // loop on every record
        .print(); // print record data into console
    
}).run(function(result){
    
    console.log("process completed");
    console.log("\t result:" + result.helloWorld.result[0]);
    
})
```

##Documents
Read documents on [Docus](https://github.com/javadparvaresh/FTaskRunner/releases/doc)

##Github
Releases of FTaskRunner are available on [Github](https://github.com/javadparvaresh/FTaskRunner/releases).

##License
FTaskRunner is licensed under the MIT License. See the LICENSE file for details.

