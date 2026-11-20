const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname, '..', 'app', 'Index.html'), 'utf8');
const code = fs.readFileSync(require('path').join(__dirname, '..', 'app', 'App.gs'), 'utf8');
const shim = fs.readFileSync(__dirname + '/shim.js', 'utf8');
const fx = fs.readFileSync(__dirname + '/fixture.json', 'utf8');
const factory = 'return (function(SpreadsheetApp,PropertiesService,LockService,HtmlService,Session,Utilities,ContentService,Logger){' + code + '\nreturn {rpc:rpc};})';
const mock = '<script>' + shim + '\n' +
  'var __FX=' + fx + ';\n' +
  'var __svc=makeServices(__FX);\n' +
  'var __sess={getActiveUser:function(){return{getEmail:function(){return "owner@x.com"}}},getEffectiveUser:function(){return{getEmail:function(){return "owner@x.com"}}}};\n' +
  'var __util={getUuid:function(){return "1234567890abcdef1234567890abcdef"}};\n' +
  'var __api=(new Function(' + JSON.stringify(factory) + '))()(__svc.SpreadsheetApp,__svc.PropertiesService,__svc.LockService,{},__sess,__util,{},{log:function(){}});\n' +
  'var __today=(location.hash.match(/today=([\\d-]+)/)||[])[1];\n' +
  'window.google={script:{get run(){var ok,fail;var o={withSuccessHandler:function(f){ok=f;return o},withFailureHandler:function(f){fail=f;return o},' +
  'rpc:function(key,fn,args){args=JSON.parse(JSON.stringify(args));setTimeout(function(){try{var r=JSON.parse(JSON.stringify(__api.rpc(key,fn,args)));if((fn==="getBootstrap"||fn==="setStart")&&__today)r.today=__today;ok&&ok(r)}catch(e){console.error(e);fail&&fail(e)}},120)}};return o}}};\n' +
  '</' + 'script>\n';
const marker = '<script>\n/* ============ Conexión';
if (html.indexOf(marker) < 0) throw new Error('marker not found');
fs.writeFileSync(__dirname + '/preview.html', html.replace(marker, mock + marker));
console.log('ok');
