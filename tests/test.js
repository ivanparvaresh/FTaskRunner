var assert = require('chai').assert;
var ftask=require("./../index");
var options={debug:true};

describe('FTaskRunner', function() {


    describe('FTask main functionallity', function () {

        it('it should return hello with no error', function (done) {
            
            ftask().build("test",function(root){
                root.string("hello");
            }).run(null)
                .then(function(branches){
                    try{
                        assert.isNotNull(branches.test);
                        assert.isNotNull(branches.test.err);
                        assert.equal(branches.test.result,"hello");
                        done();
                        
                    }catch(err){
                        done(err);
                    }
                }).catch(function(err){
                    done(err);
                });	
        });

        it('it should get param', function (done) {
            
            ftask().build("test",function(root){

                root
                    .string("hello")
                    .pushParam("param")
                    .getParam("param");
                    
            }).run(null).then(function(branches){
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    assert.equal(branches.test.result[0],"hello");
                
                    done();	
                }catch(err){
                    done(err);
                }	
            }).catch(function(err){
                done(err);
            });
            
        });

    }); // end main functionallity
    
    
    describe('FTask core tasks test', function () {

        it('#input', function (done) {
            
            var result="";	
            ftask().build("test",function(root){
                
                root.input("hello")
            
            }).run(null).then(function(branches){
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result[0],"hello");

                    done();	
                }catch(err){
                    done(err);
                }		
            }).catch(function(err){
                done(err);
            });;	
            
        });

        it('#for', function (done) {
            
            ftask().build("test",function(root){
                
                root.for(1,2);
            
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result.length,2);
                    
                    assert.equal(branches.test.result[0],1);
                    assert.equal(branches.test.result[1],2);

                    done();	
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;	
        })
        it('#for#input', function (done) {
            
            ftask().build("test",function(root){
                
                root
                    .input({
                        start:1,
                        end:2
                    })
                    .for();
            
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result.length,2);
                    
                    assert.equal(branches.test.result[0],1);
                    assert.equal(branches.test.result[1],2);

                    done();	
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;	
        })
        it('#for#emptyarray', function (done) {
            
            ftask().build("test",function(root){
                
                root
                    .input({
                        start:1,
                        end:-2
                    })
                    .for()
                    .string("hi");
            
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result[0],null);

                    done();	
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;	
        })
        it('#foreach', function (done) {
            	
            ftask().build("test",function(root){
                
                root.input(["1","2","3"]).foreach();
            
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result.length,3);
                    
                    assert.equal(branches.test.result[0],"1");
                    assert.equal(branches.test.result[1],"2");
                    assert.equal(branches.test.result[2],"3");

                    done();	
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;
        });
        it('#foreach#emptyarray', function (done) {
            	
            ftask().build("test",function(root){
                
                root.input([]).foreach().string("test");
            
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result[0],null);

                    done();	
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;
        });	
        it('#fork', function (done) {
            	
            ftask().build("test",function(root){
                root.string("hi").fork({
                        "s1":function(root){ root.string("s1"); },
                        "s2":function(root){ root.string("s2"); },
                        "s3":function(root){ root.string("s3"); }
                });
            }).run(null).then(function(branches){
                
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    assert.equal(branches.test.result[0].s1,"s1");
                    assert.equal(branches.test.result[0].s2,"s2");
                    assert.equal(branches.test.result[0].s3,"s3");
                    done();
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });;
        });	

        it("#wait",function(done){

            ftask()
            .build("test",function(root){
                root
                    .string("welcome")
                    .wait(function(root){
                        // nothing we need to do just passing valu to next one
                    });
            }).run(null).then(function(result){
                try{
                    assert.isNotNull(result.test);
                    assert.isNotNull(result.test.err);

                    assert.equal(result.test.result[0],"welcome");

                    done();
                }catch(err){
                    done(err);
                }
            }).catch(function(err){
                done(err);
            });

        })
        it("#wait #scope parameters check",function(done){

            ftask()
            .build("test",function(root){
                root
                    .string("welcome")
                    .addParam("test")
                    .wait(function(root){
                        root.getParam("test").addParam("test2");
                    });
            }).run(null).then(function(result){
                try{
                    assert.isNotNull(result.test);
                    assert.isNotNull(result.test.err);

                    assert.equal(result.test.result[0],"welcome");

                    done();
                }catch(err){
                    done(err);
                }
                
            }).catch(function(err){
                done(err);
            });

        })


        it("#rif",function(done){

            ftask()
            .build("test",function(root){
                root
                    .string("welcome")
                    .rif(function(scope){
                        return scope.$$input=="welcome";
                    },function(root){
                        root.string("welcome riff");
                    })
                    .rif(
                        scope=> scope.$$input=="welcome",
                        function(root){
                            root.string("it should ignore");
                        }
                    )
            }).run(null).then(function(result){
                try{
                    assert.isNotNull(result.test);
                    assert.isNotNull(result.test.err);

                    assert.equal(result.test.result[0],"welcome riff");

                    done();
                }catch(err){
                    done(err);
                }
                
            }).catch(function(err){
                done(err);
            });

        })

        it("#error",function(done){

            ftask().build("test",root=>{
                root
                    .custom(function(scope,next){
                        next(data); // data is not defined
                    })
                    .print();
            }).run(null).then(result=>{
                assert.isNotNull(result.test);
                assert.isNotNull(result.test.err);
                done();
            }).catch(function(err){
                done(err);
            });

        })

        it("#forSync",function(done){

            ftask().build("test",root=>{

                root
                    .forSync(1,2)
                    .custom(function(scope,next){
                        if (scope.$$input==1){
                            setTimeout(function() {
                                next(scope.$$input); // it will execute then
                            }, 20);
                        }else{
                            setTimeout(function() {
                                next(scope.$$input); // it will execute first
                            }, 10);
                        }
                    });

            }).run(null).then(function(result){
                
                try{
                    assert.isNotNull(result.test);

                    assert.equal(result.test.result[0],1);
                    assert.equal(result.test.result[1],2);

                    done();
                }catch(err){
                    done(err);
                }

            }).catch(function(err){
                done(err);
            })

        })
        it("#forSync#emptyarray",function(done){

            ftask().build("test",root=>{

                root
                    .forSync(0,-1)
                    .string("hi");

            }).run(null).then(function(result){
                
                try{
                    assert.isNotNull(result.test);

                    assert.equal(result.test.result[0],null);

                    done();
                }catch(err){
                    done(err);
                }

            }).catch(function(err){
                done(err);
            })

        })
        it("#foreachSync",function(done){

            ftask().build("test",root=>{

                root
                    .input([1,2])
                    .foreachSync()
                    .custom(function(scope,next){
                        if (scope.$$input==1){
                            setTimeout(function() {
                                next(scope.$$input); // it will execute then
                            }, 20);
                        }else{
                            setTimeout(function() {
                                next(scope.$$input); // it will execute first
                            }, 10);
                        }
                    });

            }).run(null).then(function(result){
                
                try{
                    assert.isNotNull(result.test);

                    assert.equal(result.test.result[0],1);
                    assert.equal(result.test.result[1],2);

                    done();
                }catch(err){
                    done(err);
                }

            }).catch(function(err){
                done(err);
            })

        })
        it("#foreachSync#emptyarray",function(done){

            ftask().build("test",root=>{

                root
                    .input([])
                    .foreachSync()
                    .string("hi");

            }).run(null).then(function(result){
                
                try{
                    assert.isNotNull(result.test);

                    assert.equal(result.test.result[0],null);

                    done();
                }catch(err){
                    done(err);
                }

            }).catch(function(err){
                done(err);
            })

        })
        
    });
});