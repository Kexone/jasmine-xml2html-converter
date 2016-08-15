// @protractor-helper-template

// @imports
var xmlDocument = require('xmldoc');
var fileSystem = require('fs');
var filePath = require('path');
var fineName = '';

// @class
var HTMLReport = function() {

// stacked bar chart & execution details data gets captured during input xml parsing 
var dataSeries = '';
var testExecInfo = {testStartedOn: undefined, totalTests: 0, passRate: 0.0, execTime: 0.0};

// html report file headers
var reportTitle = '<title>Protractor Test Report</title>';
var reportCss = ' <link href="http://getbootstrap.com/dist/css/bootstrap.css"rel=stylesheet> \
<style> #td-table, tr, td { \
  font-family: "Trebuchet MS", Arial, Helvetica, sans-serif; \
  width: 90%; \
  text-align: left; \
  border-collapse: collapse; \
  font-size: small; \
  border: 1px solid #000000; \
  padding: 9px; \
  background-color: #CFD8DC; \
  margin: 10px auto; \
} \
#td-table-header { \
  font-size: 1em; \
  border: 1px solid #000000; \
  padding: 9px; \
  background-color: #607D8B; \
  color: white;\
} \
#td-table-spec { \
  background-color: #90A4AE; \
  color: black; \
} \
#td-table-test-pass { \
  border: 1px solid black;\
  overflow: hidden;\
  width: 50%;\
  background-color: #009688; \
  color: white; \
} \
#td-table-test-fail { \
  border: 1px solid black;\
  overflow: hidden;\
  background-color: #d9534f; \
  width: 50%; \
  color: black; \
  overflow: hidden; \
} \
#td-table-test-skip { \
  background-color: #FFEB3B; \
  color: black; \
} \
#ts-table, #tr-ts-table, #td-ts-table { \
  font-family: "Trebuchet MS", Arial, Helvetica, sans-serif; \
  width: 95%; \
  text-align: left; \
  font-size: small; \
  border: none; \
  padding: 9px; \
  margin: 1px auto; \
  background-color: white \
} \
#div-ts-table { \
  text-align: center; \
  outline: thin solid; \
  padding: 9px; \
  background: #CFD8DC; \
  font-size: medium; \
} \
#stacked-bar-chart { \
  padding-bottom: 10em; \
  margin:-140px auto; \
} \
li { \
  padding-top:0px; \
  list-style-type: none; \
  font-family: "Trebuchet MS", Arial, Helvetica, sans-serif; \
  font-size: small; \
  padding: 7px; \
} \
</style>'

var reportScript = '<script type="text/javascript" src="https://www.google.com/jsapi"></script> \
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script> \
<script src="http://getbootstrap.com/dist/js/bootstrap.js"></script> \
<script type="text/javascript"> \
google.load("visualization", "1", {packages:["corechart"]}); \
google.setOnLoadCallback(drawChart); \
function drawChart() { \
  var data = google.visualization.arrayToDataTable([ \
  ["Genre", "Passed", "Failed", "Skipped"], <dataSeries>]); \
  var options = { \
    width: 1800, \
    height: 1400, \
    legend: { position: "top", maxLines: 3 }, \
    bar: { groupWidth: "50%" }, \
    isStacked: true, \
    colors: [ "#009688", "#d9534f", "#FFEB3B"] \
  }; \
  var chart = new google.visualization.BarChart(document.getElementById("stacked-bar-chart")); \
  chart.draw(data, options); \
} \
</script>';
// @private-function
var generateTDTable = function (reportXml) {
  var totalTests = 0;
  var totalFailures = 0;
  var totalErrors = 0;
  var totalSkips = 0;
  var totalExecTime = 0;
  var testDetailsTable = '<tr><th id="td-table-header">Spec Description</th> \
  <th id="td-table-header">Status</th>';

  var xmlData = fileSystem.readFileSync(reportXml, 'utf8');  
  var testResultXml = new xmlDocument.XmlDocument(xmlData);
  var testSuites = testResultXml.childrenNamed('testsuite');
  var testStartedOn = testSuites[0].attr.timestamp;
  var totalSuites = testSuites.length;

  // Capture tessuite execution details   
  for (var i = 0; i < totalSuites; i++) {
    var suiteName = testSuites[i].attr.name;
    var suiteTestErrors = parseInt(testSuites[i].attr.errors);
    var suiteTotalTests = parseInt(testSuites[i].attr.tests);
    var suiteTestSkips = parseInt(testSuites[i].attr.skipped);
    var suiteTestFailures = parseInt(testSuites[i].attr.failures);
    var suiteTestTime = parseFloat(testSuites[i].attr.time);
    var suitePassedTests = suiteTotalTests - suiteTestErrors - suiteTestSkips - suiteTestFailures;
    totalTests += suiteTotalTests;
    totalFailures += suiteTestFailures;
    totalErrors += suiteTestErrors;
    totalSkips += suiteTestSkips;
    totalExecTime += suiteTestTime;

    // Capture data for stacked barchart
    dataSeries += '["' + suiteName + '",' + suitePassedTests + ',' + suiteTestFailures + ',';
    dataSeries += suiteTestSkips + ']';
    dataSeries = (i == totalSuites - 1) ? dataSeries : dataSeries + ',';

    testDetailsTable += '<tr><td id="td-table-spec" colspan=3>' + suiteName + '</td></tr>';
    var testcases = testSuites[i].childrenNamed('testcase');

    // Capture tescase execution details for each testsuite
    for(var j in testcases) {
      var testFailed = testcases[j].childNamed('failure');
      var testSkipped = testcases[j].childNamed('skipped');
      var testError = testcases[j].childNamed('error');
      if(testFailed) {
        testDetailsTable += '<tr><td  id="td-table-test-fail" data-toggle="collapse" data-target='+"#failedCol" +j + ' aria-expanded="false" aria-controls='+"failedCol" +j + '><div class="collapse" id='+"failedCol" +j + '><div class="well"> <br>'   + testFailed + ' </div></div>' + testcases[j].attr.name; + '</td>'
        testDetailsTable += '<td id="td-table-test-fail" data-toggle="collapse" data-target='+"#failedCol" +j + ' aria-expanded="false" aria-controls='+"failedCol" +j + ' >Failed </td>';
      }
      else if(testSkipped) {
        testDetailsTable += '<tr><td>' + testcases[j].attr.name; + '</td>'
        testDetailsTable += '<td id="td-table-test-skip">Skipped</td><td>' + testSkipped + '</td>';
      } 
      else if(testError) {
        testDetailsTable += '<tr><td>' + testcases[j].attr.name; + '</td>'
        testDetailsTable += '<td id="td-table-test-fail"><button class="btn btn-danger btn-xs" type="button" data-toggle="collapse" data-target="#errorCol" aria-expanded="false" aria-controls="errorCol"> Failed </button><div class="collapse" id="errorCol">  <div class="well">' + testError + '</div></div></td>';
      }
      else{
        testDetailsTable += '<tr><td>' + testcases[j].attr.name; + '</td>'
        testDetailsTable += '<td id="td-table-test-pass">Passed</td>'
      }
      testDetailsTable += '</tr>';
    }
  }
  testExecInfo['testStartedOn'] = testStartedOn.replace("T", "  ");
  testExecInfo['totalTests'] = totalTests;
  testExecInfo['totalFailures'] = totalFailures;
  testExecInfo['passRate'] = ((totalTests - totalFailures - totalSkips) / totalTests).toFixed(2);
  testExecInfo['execTime'] = totalExecTime.toFixed(2);
  return testDetailsTable;
};

// @private-function
var generateTSTable = function(testConfig) {
  var testSummaryTable ='';
  if(testExecInfo['totalFailures'] > 0) {
    testSummaryTable +='<div id="stacked-bar-chart"></div>';
  }
  testSummaryTable += '<dl class="dl-horizontal"><dt><dt>Test Start:</dt> <dd>' + testExecInfo['testStartedOn'] + '</dd>';
  testSummaryTable += '<dt>Total Tests:</dt> <dd>' + testExecInfo['totalTests'] + '</dd>';
  testSummaryTable += '<dt>Failure Tests:</dt> <dd>' + testExecInfo['totalFailures'] + '</dd>';
  testSummaryTable += '<dt>Pass Rate:</dt> <dd>' + testExecInfo['passRate'] * 100 + '% </dd>';
  testSummaryTable += '<dt>Duration:</dt> <dd>' + testExecInfo['execTime'] + ' Secs ('+ (testExecInfo['execTime'] / 60).toFixed(2)  +' min)</dd>';
  for (var testConfigParam in testConfig) {
    console.log(testConfigParam)
    if(testConfigParam != 'reportTitle' && testConfigParam != 'outputPath' && testConfigParam != 'fileName') {
      testSummaryTable += '<dt>' + testConfigParam + ' :</dt><dd> ' + testConfig[testConfigParam]  + '</dd>';
    }
  }
  if(testExecInfo['totalFailures'] === 0) {
    reportCss = reportCss.replace("-140px", "0px");
    testSummaryTable +='<div id="stacked-bar-chart"></div>';
    reportScript = reportScript.replace("1800","800").replace("1400","600");
  }
  testSummaryTable += '</dl><tr id="tr-ts-table"><th colspan=2><div id="div-ts-table">';
  var testReportTitle = testConfig['reportTitle'] == undefined ? 'Test Execution Report' : testConfig['reportTitle'];
  fileName = testConfig['fileName'] == undefined ? 'test-html-report.html' : testConfig['fileName'];
  testSummaryTable += testReportTitle + '</div></th></tr>';
  testSummaryTable += '<tr id="tr-ts-table"><td id="td-ts-table"><div>';
  testSummaryTable += '</ul></div></td><td id="td-ts-table" rowspan=2></td></tr>';
  return testSummaryTable;
}


// @public-function
this.from = function(reportXml, testConfig) {
  var path = require("path");
  var testDetails = generateTDTable(reportXml);
  var testSummary = generateTSTable(testConfig);

  // Feed data to stacked bar chart 
  reportScript = reportScript.replace('<dataSeries>', dataSeries);

  // Prepare for html file content
  var htmlReport = '<html><head>' + reportTitle + reportCss + reportScript + '</head>';
  htmlReport += '<body>' + '<table id="ts-table">' + testSummary + '</table>';
  htmlReport += '<table id="td-table">' + testDetails + '</table>';
  htmlReport += '</body></html>';
  var testOutputPath = './test_output';
  if(testConfig['outputPath']) {
    var testOutputPath = testConfig['outputPath'];
  } else {
    if (!fileSystem.existsSync(testOutputPath)){
      fileSystem.mkdirSync(testOutputPath);
    } 
  }
  // Write report
  fileSystem.writeFileSync(path.join(testOutputPath, "/" + fileName + ".html"), htmlReport);
}

};

// @exports
module.exports = HTMLReport;