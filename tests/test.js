var assert = require('chai').assert;
var ftask=require("./../index");

describe('FTaskRunner', function() {


    describe('FTask main functionallity', function () {

        it('it should return hello with no error', function (done) {
            
            ftask().build("test",function(root){
                
                root.string("hello");
                
            }).run(null,function(branches){
                
                try{
                
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    assert.equal(branches.test.result[0],"hello");
                    done();
                    
                }catch(err){
                    done(err);
                }
            });	
        });

        it('it should get param', function (done) {
            
            ftask().build("test",function(root){

                root
                    .string("hello")
                    .pushParam("param")
                    .getParam("param");
                    
            }).run(null,function(branches){

                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    assert.equal(branches.test.result[0],"hello");
                
                    done();	
                }catch(err){
                    done(err);
                }	
            });
            
        });

    }); // end main functionallity
    
    
    describe('FTask core tasks test', function () {

        it('#input', function (done) {
            
            var result="";	
            ftask().build("test",function(root){
                
                root.input("hello")
            
            }).run(null,function(branches){
                try{
                    assert.isNotNull(branches.test);
                    assert.isNotNull(branches.test.err);
                    
                    assert.equal(branches.test.result[0],"hello");

                    done();	
                }catch(err){
                    done(err);
                }		
            });	
            
        });

        it('#for', function (done) {
            
            ftask().build("test",function(root){
                
                root.for(1,2);
            
            }).run(null,function(branches){
                
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
            });	
        })
        it('#foreach', function (done) {
            	
            ftask().build("test",function(root){
                
                root.input(["1","2","3"]).foreach();
            
            }).run(null,function(branches){
                
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
            });
        });	
        it('#fork', function (done) {
            	
            ftask().build("test",function(root){
                root.string("hi").fork({
                        "s1":function(root){ root.string("s1"); },
                        "s2":function(root){ root.string("s2"); },
                        "s3":function(root){ root.string("s3"); }
                });
            }).run(null,function(branches){
                
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
            });
        });	

        it("#wait",function(done){

            ftask()
            .build("test",function(root){
                root
                    .string("welcome")
                    .wait(function(root){
                        // nothing we need to do just passing valu to next one
                    });
            }).run(null,function(result){
                try{
                    assert.isNotNull(result.test);
                    assert.isNotNull(result.test.err);

                    assert.equal(result.test.result[0],"welcome");

                    done();
                }catch(err){
                    done(err);
                }
                
            })

        })
        
    });
});