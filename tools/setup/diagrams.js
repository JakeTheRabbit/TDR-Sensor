/* Code-native technical drawings: labels follow display units, pin spacing is schematic. */
(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./units.js') : root.TDRUnits);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TDRDiagrams = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(U) {
  'use strict';
  const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const line = (x1,y1,x2,y2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
  const text = (x,y,s,extra='') => `<text x="${x}" y="${y}" ${extra}>${escape(s)}</text>`;
  function wrap(body, title, id) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 310" role="img" aria-label="${escape(title)}"><defs><pattern id="fiber-${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#e8e5d6"/><path d="M1 3l6 3m-2 5l6-4" stroke="#d0cbb4" stroke-width="1"/></pattern><pattern id="coco-${id}" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#c4a282"/><path d="M1 2l4 4m1-5l1 6" stroke="#a88160" stroke-width="1"/></pattern></defs><style>text{font:13px Arial,sans-serif;fill:#384759}line,path,rect,ellipse{stroke-linecap:round}line{stroke:#506175;stroke-width:1.4}.rod{stroke:#66788e;stroke-width:4}.dim{stroke:#2767a0;stroke-width:1}.body{fill:#e0e6ed;stroke:#526477;stroke-width:1.4}.medium{stroke:#8d968e;stroke-width:1.4}.hint{fill:#2767a0}.title{font-size:16px;font-weight:600;fill:#1d2a39}</style><rect width="420" height="310" fill="#fff"/>${body}</svg>`;
  }
  function views(o) {
    const l = Number(o.l), w = Number(o.w), h = Number(o.h), z = Number(o.center);
    if (![l,w,h,z].every(Number.isFinite) || Math.min(l,w,h) <= 0) throw new Error('Enter the substrate dimensions for the diagram.');
    const coco = o.system === 'coco';
    const f = v => U.format(v, 'height', o.units, o.gallon, o.units === 'imperial' ? 3 : 1);
    const bodyLabel = `${f(88)} face · ${f(26)} high`;
    let top = text(22, 28, 'Top view', 'class="title"');
    if (coco && o.shape !== 'box') {
      const s = Math.min(1.3, 176 / w), cx = 207, cy = 140, r = w*s/2;
      top += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r}" fill="url(#coco-top)" class="medium"/>`;
      const bx = cx + r*.3 - 44*s, by = cy + r*.5;
      top += `<rect x="${bx}" y="${by}" width="${88*s}" height="${18*s}" class="body"/>`;
      for (const delta of [14,44,74]) top += line(bx+delta*s,by,bx+delta*s,by-53*s,'class="rod"');
      top += `<circle cx="${cx-8}" cy="${cy-13}" r="9" fill="#748865"/><circle cx="${cx-r*.55}" cy="${cy-r*.4}" r="4" fill="#2767a0"/>`;
      top += line(bx+88*s,by+9*s,370,205,'stroke-width="3"') + text(284,227,'Supported cable');
      top += line(cx-r,255,cx+r,255,'class="dim"') + text(cx,278,`Filled diameter ${f(w)}`,'text-anchor="middle"');
      top += text(22,52,'Pack medium around every rod.');
    } else {
      const s = Math.min(320/l, 139/w), rw=l*s, rh=w*s, x=210-rw/2, y=138-rh/2;
      const material = coco ? 'coco' : 'fiber';
      top += `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="url(#${material}-top)" class="medium"/>`;
      let sensorX=210;
      if (o.system === 'stack') {
        const plants = Math.min(Math.max(Math.round(o.plants || 3),1),8), spacing=rw/plants;
        const cube=Math.min(Number(o.blockLength||150)*s,spacing*.65,rh*.8);
        for(let i=0;i<plants;i++) top+=`<rect x="${x+spacing*(i+.5)-cube/2}" y="${y+(rh-cube)/2}" width="${cube}" height="${cube}" fill="#fbfcfd" stroke="#8a969e"/><circle cx="${x+spacing*(i+.5)}" cy="${y+rh/2}" r="3" fill="#748865"/>`;
        sensorX=x+rw*.65;
      } else if (o.system === 'cube') top+=`<circle cx="210" cy="${y+rh*.35}" r="7" fill="#748865"/>`;
      const bx=sensorX-44*s, by=y+rh;
      top+=`<rect x="${bx}" y="${by}" width="${88*s}" height="${18*s}" class="body"/>`;
      for(const delta of [14,44,74])top+=line(bx+delta*s,by,bx+delta*s,by-53*s,'class="rod"');
      top+=line(bx+88*s,by+9*s,364,227,'stroke-width="3"');
      top+=line(x,264,x+rw,264,'class="dim"')+text(210,286,`Length ${f(l)} · depth ${f(w)}`,'text-anchor="middle"');
      top+=text(22,52, 'Three rods enter horizontally.');
      top+=text(26,244, 'Long face stays level.');
    }
    let section = text(22,28, coco ? 'Container section' : 'End section', 'class="title"');
    const s=Math.min(215/Math.max(w,coco?Number(o.bottom)||w:w),157/h), base=225, x=190-w*s/2, right=x+w*s, topY=base-h*s, cy=base-z*s;
    if(coco && o.shape!=='box') {
      const bottom=Number(o.bottom)||w*.7, bx=190-bottom*s/2;
      section+=`<path d="M${x} ${topY}H${right}L${190+bottom*s/2} ${base}H${bx}Z" fill="url(#coco-section)" class="medium"/>`;
      const localWidth=bottom+(w-bottom)*(z/h), left=190-localWidth*s/2+12*s;
      section+=`<rect x="${left}" y="${cy-13*s}" width="${18*s}" height="${26*s}" class="body"/>`;
      section+=line(left+18*s,cy,left+71*s,cy,'class="rod"');
      section+=line(left-35,cy,left,cy,'stroke-width="3"');
      section+=text(22,52,'Housing supported within the medium.');
    } else {
      section+=`<rect x="${x}" y="${topY}" width="${w*s}" height="${h*s}" fill="url(#${coco?'coco':'fiber'}-section)" class="medium"/>`;
      section+=`<rect x="${right}" y="${cy-13*s}" width="${18*s}" height="${26*s}" class="body"/>`;
      section+=line(right,cy,right-53*s,cy,'class="rod"')+line(right+18*s,cy,right+50*s,cy,'stroke-width="3"');
      section+=text(22,52,'Contact face meets the substrate.');
    }
    section+=line(346,cy,346,base,'class="dim"')+line(340,cy,352,cy,'class="dim"')+line(340,base,352,base,'class="dim"');
    section+=text(340,(cy+base)/2-6,f(z),'class="hint" text-anchor="end"');
    section+=line(65,base,365,base,'stroke-dasharray="4 4"');
    section+=text(22,255,`Rods: ${f(53)} fully inside the medium`)+text(22,278,`Height: ${f(h)} · centreline from base: ${f(z)}`);
    return {top:wrap(top,`${o.system} sensor placement, top view`,'top'),section:wrap(section,`${o.system} sensor placement, end section`,'section'),bodyLabel};
  }
  function combined(o) {
    const v=views(o);
    const place=(s,x)=>s.replace('viewBox="0 0 420 310"',`x="${x}" y="40" width="420" height="310" viewBox="0 0 420 310"`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="400" viewBox="0 0 880 400"><rect width="880" height="400" fill="white"/>${text(20,25,'MT22 placement · '+(o.system==='coco'?'Coco container':o.system==='cube'?'Single cube':o.system==='stack'?'Cubes on slab':'Slab'))}${place(v.top,10)}${place(v.section,450)}<text x="22" y="378" font-family="Arial,sans-serif" font-size="13" fill="#384759">Schematic, not a drilling guide. Midpoint is a comparison position; validate contact and representativeness.</text></svg>`;
  }
  function template(o, paper='A4') {
    const h=Number(o.h), z=Number(o.center);
    if(!Number.isFinite(h)||!Number.isFinite(z)||h<26||z<13||z>h-13)throw new Error('Keep the full sensor face inside the substrate height.');
    if(!['A4','Letter'].includes(paper))throw new Error('Select A4 or Letter.');
    const pw=paper==='A4'?210:215.9, ph=paper==='A4'?297:279.4;
    const f=v=>U.format(v,'height',o.units,o.gallon,3), full=h<=150;
    const base=ph-52, cy=full?base-z:145;
    const bar=o.units==='imperial'?101.6:100, barLabel=o.units==='imperial'?'4 in':'100 mm';
    let body=`<text x="15" y="19" font-size="7" font-weight="bold">MT22 placement template</text><text x="15" y="30">${escape(o.system==='coco'?'Coco / peat container':o.system==='cube'?'Cube':'Slab')} · height ${escape(f(h))} · centreline ${escape(f(z))} above base</text><text x="15" y="39">Print ${paper} at Actual size / 100%. Disable Fit and headers/footers.</text><text x="15" y="48">Verify both ${barLabel} bars with a ruler before use.</text><text x="15" y="57">Transfer your actual pin spacing. Remove paper before insertion.</text>`;
    if(full)body+=`<rect x="15" y="${base-h}" width="170" height="${h}" stroke-dasharray="2 2"/><line x1="15" y1="${base}" x2="185" y2="${base}"/><text x="15" y="${base+7}">Base datum = bottom of actual growing medium</text>`;
    else body+=`<text x="15" y="77">Tall container: first mark ${escape(f(z))} from the substrate base with a ruler.</text><text x="15" y="86">Align the centreline below to your mark. This sheet has no base datum.</text>`;
    body+=`<rect x="61" y="${cy-13}" width="88" height="26"/><line x1="25" y1="${cy}" x2="180" y2="${cy}" stroke-dasharray="2 1"/><text x="66" y="${cy-5}">${escape(f(88))} × ${escape(f(26))} contact face</text><text x="66" y="${cy+9}">Actual pin centres on this line</text>`;
    const y=ph-18;
    body+=`<line x1="20" y1="${y}" x2="${20+bar}" y2="${y}"/><line x1="20" y1="${y-2}" x2="20" y2="${y+2}"/><line x1="${20+bar}" y1="${y-2}" x2="${20+bar}" y2="${y+2}"/><text x="55" y="${y-5}">${barLabel}</text><line x1="${pw-12}" y1="110" x2="${pw-12}" y2="${110+bar}"/><line x1="${pw-14}" y1="110" x2="${pw-10}" y2="110"/><line x1="${pw-14}" y1="${110+bar}" x2="${pw-10}" y2="${110+bar}"/><text x="${pw-8}" y="146" transform="rotate(90 ${pw-8} 146)">${barLabel}</text><text x="15" y="${ph-5}">Rod length ${escape(f(53))}. User-selected position; check the real probe and medium.</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}mm" height="${ph}mm" viewBox="0 0 ${pw} ${ph}"><style>text{font-family:Arial,sans-serif;fill:#111;font-size:3.2px}line,rect{stroke:#111;stroke-width:.25;fill:none}</style>${body}</svg>`;
  }
  return {views, combined, template};
});
