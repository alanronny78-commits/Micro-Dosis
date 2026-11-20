// Fake Apps Script services backed by fixture JSON (for local tests only)
function makeServices(FX, opts) {
  opts = opts || {};
  var writes = [];
  function colNum(L){var n=0;for(var i=0;i<L.length;i++)n=n*26+(L.charCodeAt(i)-64);return n}
  function disp(v, fmt, r) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object' && v.date) { var p=v.date.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') {
      if (/%/.test(fmt||'')) return Math.round(v*100)+'%';
      if (r >= 10 && r <= 30 && Number.isInteger(v)) return v > 0 ? '+'+v : String(v);
      return String(v);
    }
    return String(v);
  }
  var nextId = 1000;
  function Sheet(name, d) {
    this.name = name; this.d = d; this.id = nextId++;
  }
  Sheet.prototype.getSheetId = function(){ return this.id; };
  Sheet.prototype.getName = function(){ return this.name; };
  Sheet.prototype.setTabColor = function(){ return this; };
  Sheet.prototype.setName = function(n){ delete sheets[this.name]; this.name = n; sheets[n] = this; order.push(this); return this; };
  Sheet.prototype.copyTo = function(){ var c = new Sheet('Copia de ' + this.name, JSON.parse(JSON.stringify(this.d))); sheets[c.name] = c; return c; };
  Sheet.prototype.getLastColumn = function(){ return this.d.values[0].length; };
  Sheet.prototype.getRange = function(r, c, nr, nc) {
    if (typeof r === 'string') { var m = r.match(/^([A-Z]+)(\d+)$/); return new Range(this, +m[2], colNum(m[1]), 1, 1); }
    return new Range(this, r, c, nr || 1, nc || 1);
  };
  function Range(sh, r, c, nr, nc){ this.sh=sh; this.r=r; this.c=c; this.nr=nr; this.nc=nc; }
  Range.prototype._map = function(f){ var o=[]; for(var i=0;i<this.nr;i++){ var row=[]; for(var j=0;j<this.nc;j++){ var R=this.r+i, C=this.c+j; var vrow=this.sh.d.values[R-1]||[]; row.push(f(vrow[C-1], R, C)); } o.push(row);} return o; };
  Range.prototype.getValues = function(){ return this._map(function(v){ if(v===null||v===undefined) return ''; if(typeof v==='object'&&v.date) return new Date(v.date); return v; }); };
  var self = this;
  Range.prototype.getDisplayValues = function(){ var sh=this.sh; return this._map(function(v,R,C){ return disp(v, (sh.d.fmts[R-1]||[])[C-1], R); }); };
  Range.prototype.getNotes = function(){ var sh=this.sh; return this._map(function(v,R,C){ return (sh.d.notes[R-1]||[])[C-1]||''; }); };
  Range.prototype.getNote = function(){ return this.getNotes()[0][0]; };
  Range.prototype.getDisplayValue = function(){ return this.getDisplayValues()[0][0]; };
  Range.prototype.getRow = function(){ return this.r; };
  Range.prototype.clearContent = function(){ for(var i=0;i<this.nr;i++){ var row=this.sh.d.values[this.r-1+i]; if(!row) continue; for(var j=0;j<this.nc;j++){ if(this.c-1+j<row.length) row[this.c-1+j]=null; } } writes.push([this.sh.name,'clear',this.r,this.c,this.nr,this.nc]); return this; };
  Range.prototype.getColumn = function(){ return this.c; };
  Range.prototype.setValue = function(v){
    if (typeof v === 'string' && v[0] === "'") v = v.slice(1);
    else if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    var row = this.sh.d.values[this.r-1]; while (row.length < this.c) row.push(null);
    row[this.c-1] = v; writes.push([this.sh.name, this.r, this.c, v]);
  };
  var sheets = {}, order = [];
  Object.keys(FX).forEach(function(k){ sheets[k] = new Sheet(k, FX[k]); });
  var props = {};
  return {
    writes: writes, sheets: function(){ return sheets; },
    SpreadsheetApp: {
      getActiveSpreadsheet: function(){ return { getSheetByName: function(n){ return sheets[n] || null; }, getUrl: function(){ return 'https://docs.google.com/spreadsheets/d/DEMO/edit'; },
        getSheets: function(){ return Object.keys(sheets).map(function(k){ return sheets[k]; }); }, getNumSheets: function(){ return Object.keys(sheets).length; },
        setActiveSheet: function(s){ return s; }, moveActiveSheet: function(){} }; },
      flush: function(){}
    },
    PropertiesService: { getDocumentProperties: function(){ return { getProperty: function(k){ return props[k] || null; }, setProperty: function(k,v){ props[k]=v; } }; } },
    LockService: { getDocumentLock: function(){ return { waitLock: function(){}, releaseLock: function(){} }; } },
    HtmlService: {}
  };
}
if (typeof module !== 'undefined') module.exports = makeServices;
