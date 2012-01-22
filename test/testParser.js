var loadModule = require("./testHelpers/moduleLoader.js").loadModule;
var parser = require("../lib/parser");
var should = require("should");
var util = require("util");

var parserModule = loadModule("./lib/parser.js");
var parserExports = parserModule.module.exports;

var MULTILINE_CODE_COMMENTS = "function () { some \ncode\n here }\n\n /** \n * This is a comment\n\n * @param {String} param a parameter\n */\nvar f = function () { more code } /**\n * Another comment \n */";

exports.testParse = function (test) {
    var comments = parserExports.parse(MULTILINE_CODE_COMMENTS);

    comments.length.should.equal(2);
    comments[0].doc.should.equal("/** \n * This is a comment\n\n * @param {String} param a parameter\n */");
    comments[0].code.should.equal("\nvar f = function () { more code } ");
    var docData = comments[0].docData;
    docData.length.should.equal(3);
    docData[0].should.equal("This is a comment");
    docData[1].should.equal("");
    docData[2].should.equal("@param {String} param a parameter");

    comments[1].doc.should.equal("/**\n * Another comment \n */");
    should.not.exist(comments[1].code);
    docData = comments[1].docData;
    docData.length.should.equal(1);
    docData[0].should.equal("Another comment");
    
    test.done();
};

exports.testFirstComment = function (test) {
    var code = MULTILINE_CODE_COMMENTS;
    var next = parserModule.firstComment(code);
    should.exist(next);
    should.exist(next[0]);
    next.index.should.equal(35);
    next[0].should.equal("/** \n * This is a comment\n\n * @param {String} param a parameter\n */");

    code = code.substr(next.index + next[0].length);

    next = parserModule.firstComment(code);

    should.exist(next);
    should.exist(next[0]);
    next.index.should.equal(35);
    next[0].should.equal("/**\n * Another comment \n */");

    test.done();
};

exports.testFirstNonComment = function (test) {
    var codeAndComments = MULTILINE_CODE_COMMENTS;
    var code = parserModule.firstNonComment(codeAndComments);
    should.exist(code);
    code.should.equal("function () { some \ncode\n here }\n\n ");

    codeAndComments = "/** comments */ not a comment";
    code = parserModule.firstNonComment(codeAndComments);
    should.not.exist(code);
    should.equal(null, code);

    test.done();
};

exports.testFindComments = function (test) {
    var comments = parserModule.findComments(MULTILINE_CODE_COMMENTS);
    comments.length.should.equal(2);
    comments[0].doc.should.equal("/** \n * This is a comment\n\n * @param {String} param a parameter\n */");
    comments[0].code.should.equal("\nvar f = function () { more code } ");
    comments[1].doc.should.equal("/**\n * Another comment \n */");
    should.equal(comments[1].code, null);
    
    test.done();
};

exports.testNormalizeComment = function (test) {
    var comments = parserModule.findComments(MULTILINE_CODE_COMMENTS);
    var normalized = parserModule.normalizeComment (comments[0].doc);

    normalized.length.should.equal(3);
    normalized[0].should.equal("This is a comment");
    normalized[1].should.equal("");
    normalized[2].should.equal("@param {String} param a parameter");

    test.done();
};

exports.testIsCommentLine = function (test) {
    function check (line, expectation) {
        return parserModule.isCommentLine(line).should.equal(expectation);
    }
    check("/**", true);
    check(" /** ", true);
    check("/****", true);
    check("*/", true);
    check("       */ ", true);
    check("********/", true);
    check("/", false);
    check("* /", false);    
    check("/ *", false);
    check("hello", false);
    check("hello /*", false);
    check("/*", false);
    check("* * *", false);
    check("", false);
    check("\n", false);

    test.done();
};