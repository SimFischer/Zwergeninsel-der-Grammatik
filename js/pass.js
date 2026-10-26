/* G1-Grammatikpass: 11 unabhängige Tiefen, Karte, Figur, Inselstand, 16-Bit-Prüfung.
   Argumentationspässe bleiben getrennt: alte Leistungen sind keine Grammatikkompetenzen. */
(function () {
  const Z=window.ZI, A='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const checksum=n=>{let h=0x4a31;while(n){h=((h*31)^Number(n&255n))&65535;n>>=8n;}return h;};
  const integer=(v,min,max,fallback)=>Number.isInteger(v)&&v>=min&&v<=max?v:fallback;
  class Stand {
    constructor(o={}) {
      this.id=integer(o.id,1,32,0); this.zwerg=integer(o.zwerg,1,12,1); this.welt=integer(o.welt,0,11,0);
      this.t=Array.from({length:11},(_,i)=>integer(o.t?.[i],0,5,0));
    }
    tiefe(i){return this.t[i]||0;}
    coreTotal(){return this.t.filter(t=>t>=1).length;}
    coreCount(k){return Z.STOLLEN.filter(s=>s.kapitel===k&&this.t[s.index]>=1).length;}
    kapitelFertig(k){return Z.STOLLEN.filter(s=>s.kapitel===k).every(s=>this.t[s.index]>=1);}
    gems(){return this.t.reduce((n,t)=>n+Math.max(0,Math.min(t,4)-1)*Z.REGELN.edelsteine,0);}
    kronenTotal(){return this.t.filter(t=>t===5).length;}
    zwergFrei(n){const z=Z.ZWERGE.find(z=>z.nr===n);return !!z&&(!!z.start||z.unlock(this));}
    freieZwerge(){return Z.ZWERGE.filter(z=>this.zwergFrei(z.nr)).map(z=>z.nr);}
    abschliessen(i,tiefe){
      if(!Number.isInteger(i)||i<0||i>10||!Z.stollenFrei(this,i)||!Number.isInteger(tiefe)||tiefe<1||tiefe>5||tiefe>this.t[i]+1)return false;
      const neu=tiefe>this.t[i];this.t[i]=Math.max(this.t[i],tiefe);return neu;
    }
    code(){
      let n=BigInt(this.id);n=n*12n+BigInt(this.zwerg-1);n=n*12n+BigInt(this.welt);
      this.t.forEach(t=>{n=n*6n+BigInt(t);});n=(n<<16n)|BigInt(checksum(n));
      let s='';for(let i=0;i<12;i++){s=A[Number(n&31n)]+s;n>>=5n;}return 'G1-'+s.match(/.{4}/g).join('-');
    }
    static ausCode(text){
      const s=String(text||'').toUpperCase().replace(/[\s-]/g,'');if(!/^G1[A-HJ-NP-Z2-9]{12}$/.test(s))return null;
      let n=0n;for(const c of s.slice(2)){const v=A.indexOf(c);if(v<0)return null;n=n*32n+BigInt(v);}
      const check=Number(n&65535n);n>>=16n;if(checksum(n)!==check)return null;
      const t=Array(11);for(let i=10;i>=0;i--){t[i]=Number(n%6n);n/=6n;}
      const welt=Number(n%12n);n/=12n;const zwerg=Number(n%12n)+1;n/=12n;const id=Number(n);if(id>32)return null;
      const stand=new Stand({id,zwerg,welt,t});return stand.code().replace(/-/g,'')===s?stand:null;
    }
    static zusammen(a,b){return new Stand({id:a.id,zwerg:b.zwerg,welt:Math.max(a.welt,b.welt),t:a.t.map((t,i)=>Math.max(t,b.t[i]))});}
  }
  Z.Stand=Stand;
  Z.botschaft={
    kodiere(welt){return 'INSEL-'+new Stand({welt}).code().slice(3);},
    lese(text){const s=Stand.ausCode(String(text).toUpperCase().replace(/^INSEL[\s-]*/,'G1-'));return s&&s.id===0&&s.t.every(t=>t===0)?s.welt:null;},
  };
})();
