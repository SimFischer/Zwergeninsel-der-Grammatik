/* Datengetriebene Aufgaben-Engines. Keine Grammatikregeln in der Oberfläche. */
(function(){
  const Z=window.ZI, {h}=Z;
  const norm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ').replace(/\s+([.,!?;:])/g,'$1');
  const setEqual=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every(x=>b.includes(x))&&new Set(a).size===a.length;
  const textCheck=(q,a)=>q.fields
    ? Array.isArray(a)&&a.length===q.fields.length&&q.fields.every((f,i)=>f.solutions.some(s=>norm(s)===norm(a[i])))
    : q.solutions.some(s=>norm(s)===norm(a));
  Z.ENGINES={
    choice:{check:(q,a)=>(q.acceptedAnswers||[q.answer]).includes(a)},
    mark:{check:(q,a)=>setEqual(a,q.answer)},
    groups:{check:(q,a)=>setEqual(a,q.answer)},
    sort:{check:(q,a)=>Array.isArray(a)&&a.length===q.answer.length&&a.every((x,i)=>x===q.answer[i])},
    match:{check:(q,a)=>Array.isArray(a)&&a.length===q.answer.length&&a.every((x,i)=>x===q.answer[i])},
    gap:{check:(q,a)=>textCheck(q,a)},
    form:{check:(q,a)=>textCheck(q,a)},
    order:{check:(q,a)=>q.answers.some(s=>JSON.stringify(s)===JSON.stringify(a))},
    repair:{check:(q,a)=>!!a&&setEqual(a.mark,q.answer)&&q.solutions.some(s=>norm(s)===norm(a.text))},
    transfer:{check:(q,a)=>textCheck(q,a)},
  };
  Z.loesung=q=>{
    if(q.type==='choice')return (q.acceptedAnswers||[q.answer]).join(' / ');
    if(q.fields)return q.fields.map(f=>Z.feldLabel(q,f)+': '+f.solutions.join(' / ')).join('; ');
    if(['mark','groups'].includes(q.type))return q.answer.map(i=>q.tokens[i]).join(' · ');
    if(['sort','match'].includes(q.type))return q.items.map((s,i)=>s+' → '+q.answer[i]).join('; ');
    if(q.type==='order')return q.answers.map(a=>{const sentence=a.map((i,pos)=>pos>0&&q.lowercaseParts?.includes(i)?q.parts[i][0].toLowerCase()+q.parts[i].slice(1):q.parts[i]).join(' ');return sentence[0].toUpperCase()+sentence.slice(1);}).join(' / ');
    return q.solutions.join(' / ');
  };
  Z.rueckmeldung=(q,a)=>{
    if(['mark','groups'].includes(q.type)&&Array.isArray(a)){
      if(a.length&&a.every(i=>q.answer.includes(i)))return 'Du hast einen Teil gefunden. Suche noch die fehlenden Wörter. '+q.hints[1];
      if(q.answer.every(i=>a.includes(i)))return 'Die gesuchten Wörter sind dabei. Entferne die Markierungen, die nicht dazugehören. '+q.hints[1];
    }
    if(q.type==='repair'&&a&&setEqual(a.mark,q.answer))return 'Die Fehlerstelle stimmt. Prüfe jetzt deine Verbesserung. '+q.hints[1];
    return 'Prüfe deine Lösung noch einmal. '+q.hints[0];
  };
  Z.aufgabeAnsicht=function(q){
    const box=h('div',{class:'g-engine'});let read;
    if(q.context)box.append(h('p',{class:'g-context'},q.context));
    if(q.degreeExample)box.append(h('p',{class:'g-small g-example'},'Unabhängiges Beispiel: Grundform (Positiv) '+q.degreeExample[0]+' → '+q.degreeExample[1]+' → '+q.degreeExample[2]));
    if(q.fields){
      const controls=q.fields.map((f,i)=>{
        if(f.options?.some(o=>o.length>55)){
          const state={value:''},group=h('div',{class:'g-field-options',role:'group','aria-label':Z.feldLabel(q,f)});
          const buttons=Z.mischen(f.options).map(option=>h('button',{class:'option g-option',type:'button','aria-pressed':'false',onclick:()=>{state.value=option;buttons.forEach(b=>{const active=b.textContent===option;b.classList.toggle('aktiv',active);b.setAttribute('aria-pressed',String(active));});}},option));
          group.append(...buttons);box.append(h('div',{class:'g-field g-long','data-field-index':i},h('span',null,Z.feldLabel(q,f)),group));return state;
        }
        const field=f.options?h('select',{'aria-label':Z.feldLabel(q,f)},h('option',{value:''},'Bitte auswählen'),...Z.mischen(f.options).map(o=>h('option',{value:o},o)))
          :h('input',{'aria-label':Z.feldLabel(q,f),type:'text',autocomplete:'off',autocorrect:'off',autocapitalize:'none',spellcheck:'false'});
        box.append(h('label',{class:'g-field','data-field-index':i},h('span',null,Z.feldLabel(q,f)),field));return field;
      });read=()=>controls.map(c=>c.value);
    }else if(q.type==='choice'){
      let val=null;
      const buttons=Z.mischen(q.options).map(text=>{
        const b=h('button',{class:'option g-option',type:'button','aria-pressed':'false',onclick:()=>{val=text;buttons.forEach(x=>{x.classList.toggle('aktiv',x===b);x.setAttribute('aria-pressed',String(x===b));});}},text);return b;
      });box.append(...buttons);read=()=>val;
    }else if(['mark','groups','repair'].includes(q.type)){
      const selected=new Set();const tokens=h('div',{class:'g-tokens','aria-label':'Wörter im Satz'});
      q.tokens.forEach((text,i)=>{
        if(/^[.,!?;:]$/.test(text)){tokens.append(h('span',null,text));return;}
        const b=h('button',{class:'g-token',type:'button','aria-pressed':'false',onclick:()=>{if(selected.has(i))selected.delete(i);else selected.add(i);b.classList.toggle('aktiv',selected.has(i));b.setAttribute('aria-pressed',String(selected.has(i)));}},Z.wortAnzeige(q,i));tokens.append(b);
      });box.append(tokens);read=()=>[...selected].sort((a,b)=>a-b);
      if(q.type==='repair'){
        const field=h('textarea',{rows:2,'aria-label':'Verbesserter Satz',autocapitalize:'sentences',spellcheck:'false',autocomplete:'off'});
        box.append(h('label',null,'Schreibe den verbesserten Satz:',field));read=()=>({mark:[...selected].sort((a,b)=>a-b),text:field.value});
      }
    }else if(['sort','match'].includes(q.type)){
      const rows=[];const choices=q.items.map((item,i)=>{
        const select=h('select',{'aria-label':item,'data-item-index':i},h('option',{value:''},'Bitte zuordnen'),...Z.mischen(q.categories).map(c=>h('option',{value:c},c)));
        rows.push(h('label',{class:'g-match'},h('span',null,item),select));return select;
      });box.append(...Z.mischen(rows));read=()=>choices.map(s=>s.value);
    }else if(q.type==='order'){
      let used=[];const tray=h('div',{class:'g-tray','aria-label':'Dein Satz'}),bank=h('div',{class:'g-tokens','aria-label':'Satzbausteine'});
      function draw(){
        Z.setze(tray,...used.map((id,pos)=>h('button',{class:'g-token aktiv',type:'button',onclick:()=>{used.splice(pos,1);draw();},'aria-label':q.parts[id]+' zurücklegen'},pos===0?q.parts[id][0].toUpperCase()+q.parts[id].slice(1):q.lowercaseParts?.includes(id)?q.parts[id][0].toLowerCase()+q.parts[id].slice(1):q.parts[id])));
        Z.setze(bank,...sequence.filter(id=>!used.includes(id)).map(id=>h('button',{class:'g-token',type:'button',onclick:()=>{used.push(id);draw();}},q.parts[id])));
      }
      const sequence=Z.mischen(q.parts.map((_,i)=>i));box.append(h('p',{class:'g-small'},'Tippe Bausteine in der gewünschten Reihenfolge an. Tippe oben, um einen Baustein zurückzulegen.'),tray,bank);draw();read=()=>used.slice();
    }else{
      const field=h(q.type==='transfer'?'textarea':'input',{'aria-label':'Deine Antwort',rows:q.type==='transfer'?2:null,type:q.type==='transfer'?null:'text',autocomplete:'off',autocorrect:'off',autocapitalize:'none',spellcheck:'false'});
      box.append(h('label',null,'Deine Antwort',field));read=()=>field.value;
    }
    return {el:box,read,disable:()=>box.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=true)};
  };
})();
