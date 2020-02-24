function escapeHTML(s: string){
	s += '';
	for(var ps=false,h='',c,i=0; i<s.length; i++){
		c = s.charCodeAt(i);
		if(
			(c<32||c>127) // ASCII
			&&(c<12593||c>12643) // ㄱ-ㅎㅏ-ㅣ
			&&(c<44032||c>55203) // 가-힣
		) h += '&#'+c+';';
		else if(s[i]==' '&&ps) h += '&#32;';
		else if(s[i]=='"') h += '&quot;';
		else if(s[i]=='&') h += '&amp;';
		else if(s[i]=='<') h += '&lt;';
		else if(s[i]=='>') h += '&gt;';
		else h += s[i];
		
		ps = s[i] == ' ';
	}
	return h;
};
function _setAttr(t: HWPNode, n: string, v: any){
	if(t.attr[n] === undefined) console.warn("Warning [%s]: unexpected attr %s", t.name, n);
	t.attr[n] = v;
};

class HWPNode {
	public name:string;
	public value: any = null;
	public offset = 0;
	public attr: object;
	public children: HWPNode[];
	public encoding?: string;

	constructor(name: string, attr: object, encoding?: string) {
		this.name = name;
		this.attr = attr;
		this.children = [];
		this.encoding = encoding;
	}


	
	public getEncodedValue(toHML: (obj: HWPNode, tab: string, nl: string) => string) {
		if(this.value == null) return null;
		switch(this.encoding){
			case 'base64':
				return escapeHTML((new Buffer(this.value, 'utf16le')).toString('base64'));
			default:
				if(this.children.length > 0){
					var li = 0, v = "";
					this.children.forEach((elem) => {
						v += escapeHTML(this.value.slice(li, elem.offset));
						v += toHML(elem, '', '');
						li = elem.offset;
					}, this);
					return v + escapeHTML(this.value.slice(li));
				}
		}
		return escapeHTML(this.value);
	}
	
	public toHML(verbose: boolean){
		const toHML = (obj: HWPNode, tab: string, nl: string) => {
			var i, e, hml = "";
			var ov = obj.getEncodedValue(toHML);
			if(obj.name == 'HWPML')
				hml += tab + "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\" ?>\n";
			hml += tab + '<' + obj.name;
			for(e in obj.attr){
				// undefined? undefined+null?
				if(obj.attr[e] != undefined) hml += ' '+e+'="'+escapeHTML(obj.attr[e])+'"';
			}
			if(obj.children && obj.children.length > 0){
				hml += '>'+nl;
				for(i=0;i<obj.children.length;i++){
					hml += toHML(obj.children[i], verbose? tab+'  ': '', nl);
				}
				if(ov) hml += ov;
				hml += tab+'</'+obj.name+'>'+nl;
			}else if(ov != null){
				hml += '>'+ov+'</'+obj.name+'>'+nl;
			}else{
				hml += '/>'+nl;
			}
			return hml;
		};
		return toHML(this, '', verbose? '\n': '');
	}
	
	public add(elem: HWPNode){
		this.children.push(elem);
		this.setCount();
	}
	
	public setAttrWithFilter(attrs: object, filter: Function){
		filter = filter.bind(attrs);
		for(var name in attrs){
			if(name[0] == '_' || typeof attrs[name] == 'object') continue;
			if(filter(name)) _setAttr(this, name, attrs[name]);
		}
	}
	
	public setAttr(attrs: object, list: string[]){
		if(list) {
			list.forEach((name) => {
				_setAttr(this, name, attrs[name]);
			});
		} else {
			for(let name in attrs) {
				if(name[0] == '_' || typeof attrs[name] == 'object') continue;
				_setAttr(this, name, attrs[name]);
			}
		}
	}
	
	public setCount(){
		if('Count' in this.attr) this.attr['Count'] = this.children.length;
	};
	
	public getChild(name: string){
		name = name.toUpperCase();
		for(var i=0;i<this.children.length;i++){
			if(this.children[i].name === name) return this.children[i];
		}
		var o = new root.node[name]();
		this.add(o); return o;
	};

	public go(name: string) {
		name = name.toUpperCase();
		for(let i=0;i<this.children.length;i++){
			if(this.children[i].name === name) return this.children[i];
		}
		return null;
	}
	
	public findChild(name: string){
		return this.go(name);
	}
	
	public findChildren(name: string){
		name = name.toUpperCase();
		return this.children.filter((o) => {return o.name === name;});
	};
	
	public getChildWith(name: string, attr_name: string, attr_val: any) {
		name = name.toUpperCase();
		for(let i = 0; i < this.children.length; i++) {
			if(this.children[i].name === name && this.children[i].attr[attr_name] === attr_val) return this.children[i];
		}

		const o = createHWPNode(name);
		o.attr[attr_name] = attr_val;
		return o;
		/* TO DO
		var o = new root.node[name]();
		o.attr[attr_name] = attr_val;
		this.add(o); return o;
		*/
	}
	
	public findChildWith(name: string, attr_name: string, attr_val: any){
		name = name.toUpperCase();
		for(let i = 0; i < this.children.length; i++) {
			if(this.children[i].name === name && this.children[i].attr[attr_name] === attr_val) return this.children[i];
		}
		return null;
	};
}

/* TO DO
for(var name in root.node){
	root.node[name].prototype = new HWPNode();
}
*/

export function createHWPNode(name : string) {
	const attr: any = {};
	let encoding: string|undefined = undefined;
	switch(name) {
		case 'HWPML':
			attr.Version = '2.8';
			attr.SubVersion = '8.0.0.0';
			attr.Style = 'embed';
			break;
		case 'HEAD':

		case 'DOCSUMMARY':

			break;
		default:

	}

	return new HWPNode(name, attr, encoding);
}
/*

root.node.HEAD=function Node_HEAD(){
	this.name="HEAD";this.attr={};this.children=[];
	this.attr.SecCnt=null;
};
// 4.1. 문서 요약 정보 엘리먼트
root.node.DOCSUMMARY=function Node_DOCSUMMARY(){
	this.name="DOCSUMMARY";this.attr={};this.children=[];
};
root.node.TITLE=function Node_TITLE(){
	this.name="TITLE";this.attr={};this.children=[];
};
root.node.SUBJECT=function Node_SUBJECT(){
	this.name="SUBJECT";this.attr={};this.children=[];
};
root.node.AUTHOR=function Node_AUTHOR(){
	this.name="AUTHOR";this.attr={};this.children=[];
};
root.node.DATE=function Node_DATE(){
	this.name="DATE";this.attr={};this.children=[];
};
root.node.KEYWORDS=function Node_KEYWORDS(){
	this.name="KEYWORDS";this.attr={};this.children=[];
};
root.node.COMMENTS=function Node_COMMENTS(){
	this.name="COMMENTS";this.attr={};this.children=[];
};
root.node.FORBIDDENSTRING=function Node_FORBIDDENSTRING(){
	this.name="FORBIDDENSTRING";this.attr={};this.children=[];
};
root.node.FORBIDDEN=function Node_FORBIDDEN(){
	this.name="FORBIDDEN";this.attr={};this.children=[];
	this.encoding="base64";
	this.attr.Id=null;
};
// 4.2. 문서 설정 정보 엘리먼트
root.node.DOCSETTING=function Node_DOCSETTING(){
	this.name="DOCSETTING";this.attr={};this.children=[];
};
root.node.BEGINNUMBER=function Node_BEGINNUMBER(){
	this.name="BEGINNUMBER";this.attr={};this.children=[];
	this.attr.Page=null;
	this.attr.Footnote=null;
	this.attr.Endnote=null;
	this.attr.Picture=null;
	this.attr.Table=null;
	this.attr.Equation=null;
	this.attr.TotalPage=null;
};
root.node.CARETPOS=function Node_CARETPOS(){
	this.name="CARETPOS";this.attr={};this.children=[];
	this.attr.List=null;
	this.attr.Para=null;
	this.attr.Pos=null;
};
// 4.3. 문서 글꼴 / 스타일 정보
root.node.MAPPINGTABLE=function Node_MAPPINGTABLE(){
	this.name="MAPPINGTABLE";this.attr={};this.children=[];
};
// 4.3.1. 문서 내 그림 / OLE 정보
root.node.BINDATALIST=function Node_BINDATALIST(){
	this.name="BINDATALIST";this.attr={};this.children=[];
	this.attr.Count="0";
};
root.node.BINITEM=function Node_BINITEM(){
	this.name="BINITEM";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.APath=null;
	this.attr.RPath=null;
	this.attr.BinData=null;
	this.attr.Format=null;
};
// 4.3.2. 글꼴 정보
root.node.FACENAMELIST=function Node_FACENAMELIST(){
	this.name="FACENAMELIST";this.attr={};this.children=[];
};
root.node.FONTFACE=function Node_FONTFACE(){
	this.name="FONTFACE";this.attr={};this.children=[];
	this.attr.Lang=null;
	this.attr.Count=null;
};
root.node.FONT=function Node_FONT(){
	this.name="FONT";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Type=null;
	this.attr.Name=null;
};
root.node.SUBSTFONT=function Node_SUBSTFONT(){
	this.name="SUBSTFONT";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.Name=null;
};
root.node.TYPEINFO=function Node_TYPEINFO(){
	this.name="TYPEINFO";this.attr={};this.children=[];
	this.attr.FamilyType=null;
	this.attr.SerifStyle=null;
	this.attr.Weight=null;
	this.attr.Proportion=null;
	this.attr.Contrast=null;
	this.attr.StrokeVariation=null;
	this.attr.ArmStyle=null;
	this.attr.Letterform=null;
	this.attr.Midline=null;
	this.attr.XHeight=null;
};
// 4.3.3. 테두리 / 배경 / 채우기 정보
root.node.BORDERFILLLIST=function Node_BORDERFILLLIST(){
	this.name="BORDERFILLLIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.BORDERFILL=function Node_BORDERFILL(){
	this.name="BORDERFILL";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.ThreeD="false";
	this.attr.Shadow="false";
	this.attr.Slash="0";
	this.attr.BackSlash="0";
	this.attr.CrookedSlash="0";
	this.attr.CounterSlash="0";
	this.attr.CounterBackSlash="0";
	this.attr.BreakCellSeparateLine="0";
	// 문서에 없음
	this.attr.CenterLine="0";
};
root.node.LEFTBORDER=function Node_LEFTBORDER(){
	this.name="LEFTBORDER";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color="0";
};
root.node.RIGHTBORDER=function Node_RIGHTBORDER(){
	this.name="RIGHTBORDER";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color="0";
};
root.node.TOPBORDER=function Node_TOPBORDER(){
	this.name="TOPBORDER";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color="0";
};
root.node.BOTTOMBORDER=function Node_BOTTOMBORDER(){
	this.name="BOTTOMBORDER";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color="0";
};
root.node.DIAGONAL=function Node_DIAGONAL(){
	this.name="DIAGONAL";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color="0";
};
root.node.FILLBRUSH=function Node_FILLBRUSH(){
	this.name="FILLBRUSH";this.attr={};this.children=[];
};
root.node.WINDOWBRUSH=function Node_WINDOWBRUSH(){
	this.name="WINDOWBRUSH";this.attr={};this.children=[];
	this.attr.FaceColor=null;
	this.attr.HatchColor=null;
	this.attr.HatchStyle=null;
	this.attr.Alpha=null;
};
root.node.GRADATION=function Node_GRADATION(){
	this.name="GRADATION";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.Angle="90";
	this.attr.CenterX="0";
	this.attr.CenterY="0";
	this.attr.Step="50";
	this.attr.ColorNum="2";
	this.attr.StepCenter="50";
	this.attr.Alpha=null;
};
root.node.COLOR=function Node_COLOR(){
	this.name="COLOR";this.attr={};this.children=[];
	this.attr.Value=null;
};
root.node.IMAGEBRUSH=function Node_IMAGEBRUSH(){
	this.name="IMAGEBRUSH";this.attr={};this.children=[];
	this.attr.Mode="Tile";
};
root.node.IMAGE=function Node_IMAGE(){
	this.name="IMAGE";this.attr={};this.children=[];
	this.attr.Bright="0";
	this.attr.Contrast="0";
	this.attr.Effect=null;
	this.attr.BinItem=null;
	this.attr.Alpha=null;
};
// 4.3.4. 글자 모양 정보
root.node.CHARSHAPELIST=function Node_CHARSHAPELIST(){
	this.name="CHARSHAPELIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.CHARSHAPE=function Node_CHARSHAPE(){
	this.name="CHARSHAPE";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Height="1000";
	this.attr.TextColor="0";
	this.attr.ShadeColor="4294967295";
	this.attr.UseFontSpace="false";
	this.attr.UseKerning="false";
	this.attr.SymMark="0";
	this.attr.BorderFillId=null;
};
root.node.FONTID=function Node_FONTID(){
	this.name="FONTID";this.attr={};this.children=[];
	this.attr.Hangul=null;
	this.attr.Latin=null;
	this.attr.Hanja=null;
	this.attr.Japanese=null;
	this.attr.Other=null;
	this.attr.Symbol=null;
	this.attr.User=null;
};
root.node.RATIO=function Node_RATIO(){
	this.name="RATIO";this.attr={};this.children=[];
	this.attr.Hangul="100";
	this.attr.Latin="100";
	this.attr.Hanja="100";
	this.attr.Japanese="100";
	this.attr.Other="100";
	this.attr.Symbol="100";
	this.attr.User="100";
};
root.node.CHARSPACING=function Node_CHARSPACING(){
	this.name="CHARSPACING";this.attr={};this.children=[];
	this.attr.Hangul="0";
	this.attr.Latin="0";
	this.attr.Hanja="0";
	this.attr.Japanese="0";
	this.attr.Other="0";
	this.attr.Symbol="0";
	this.attr.User="0";
};
root.node.RELSIZE=function Node_RELSIZE(){
	this.name="RELSIZE";this.attr={};this.children=[];
	this.attr.Hangul="100";
	this.attr.Latin="100";
	this.attr.Hanja="100";
	this.attr.Japanese="100";
	this.attr.Other="100";
	this.attr.Symbol="100";
	this.attr.User="100";
};
root.node.CHAROFFSET=function Node_CHAROFFSET(){
	this.name="CHAROFFSET";this.attr={};this.children=[];
	this.attr.Hangul="0";
	this.attr.Latin="0";
	this.attr.Hanja="0";
	this.attr.Japanese="0";
	this.attr.Other="0";
	this.attr.Symbol="0";
	this.attr.User="0";
};
root.node.ITALIC=function Node_ITALIC(){
	this.name="ITALIC";this.attr={};this.children=[];
};
root.node.BOLD=function Node_BOLD(){
	this.name="BOLD";this.attr={};this.children=[];
};
root.node.UNDERLINE=function Node_UNDERLINE(){
	this.name="UNDERLINE";this.attr={};this.children=[];
	this.attr.Type="Bottom";
	this.attr.Shape="Solid";
	this.attr.Color="0";
};
root.node.STRIKEOUT=function Node_STRIKEOUT(){
	this.name="STRIKEOUT";this.attr={};this.children=[];
	this.attr.Type="Continuous";
	this.attr.Shape="Solid";
	this.attr.Color="0";
};
root.node.OUTLINE=function Node_OUTLINE(){
	this.name="OUTLINE";this.attr={};this.children=[];
	this.attr.Type="Solid";
};
root.node.SHADOW=function Node_SHADOW(){
	this.name="SHADOW";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.Color=null;
	this.attr.OffsetX="10";
	this.attr.OffsetY="10";
	this.attr.Alpha=null;
};
root.node.EMBOSS=function Node_EMBOSS(){
	this.name="EMBOSS";this.attr={};this.children=[];
};
root.node.ENGRAVE=function Node_ENGRAVE(){
	this.name="ENGRAVE";this.attr={};this.children=[];
};
root.node.SUPERSCRIPT=function Node_SUPERSCRIPT(){
	this.name="SUPERSCRIPT";this.attr={};this.children=[];
};
root.node.SUBSCRIPT=function Node_SUBSCRIPT(){
	this.name="SUBSCRIPT";this.attr={};this.children=[];
};
// 4.3.5. 탭 정보
root.node.TABDEFLIST=function Node_TABDEFLIST(){
	this.name="TABDEFLIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.TABDEF=function Node_TABDEF(){
	this.name="TABDEF";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.AutoTabLeft="false";
	this.attr.AutoTabRight="false";
};
root.node.TABITEM=function Node_TABITEM(){
	this.name="TABITEM";this.attr={};this.children=[];
	this.attr.Pos=null;
	this.attr.Type="Left";
	this.attr.Leader="Solid";
};
root.node.NUMBERINGLIST=function Node_NUMBERINGLIST(){
	this.name="NUMBERINGLIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.NUMBERING=function Node_NUMBERING(){
	this.name="NUMBERING";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Start="1";
};
root.node.PARAHEAD=function Node_PARAHEAD(){
	this.name="PARAHEAD";this.attr={};this.children=[];
	this.attr.Level=null;
	this.attr.Alignment="Left";
	this.attr.UseInstWidth="true";
	this.attr.AutoIndent="true";
	this.attr.WidthAdjust="0";
	this.attr.TextOffsetType="percent";
	this.attr.TextOffset="50";
	this.attr.NumFormat="Digit";
	this.attr.CharShape=null;
};
// 4.3.6. 글머리표 정보
root.node.BULLETLIST=function Node_BULLETLIST(){
	this.name="BULLETLIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.BULLET=function Node_BULLET(){
	this.name="BULLET";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Char=null;
	this.attr.Image="false";
};
// 4.3.7. 문단 모양 정보
root.node.PARASHAPELIST=function Node_PARASHAPELIST(){
	this.name="PARASHAPELIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.PARASHAPE=function Node_PARASHAPE(){
	this.name="PARASHAPE";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Align="Justify";
	this.attr.VerAlign="Baseline";
	this.attr.HeadingType="None";
	this.attr.Heading=null;
	this.attr.Level="0";
	this.attr.TabDef=null;
	this.attr.BreakLatinWord="KeepWord";
	this.attr.BreakNonLatinWord="true";
	this.attr.Condense="0";
	this.attr.WidowOrphan="false";
	this.attr.KeepWithNext="false";
	this.attr.KeepLines="false";
	this.attr.PageBreakBefore="false";
	this.attr.FontLineHeight="false";
	this.attr.SnapToGrid="true";
	this.attr.LineWrap="break";
	this.attr.AutoSpaceEAsianEng="true";
	this.attr.AutoSpaceEAsianNum="true";
};
root.node.PARAMARGIN=function Node_PARAMARGIN(){
	this.name="PARAMARGIN";this.attr={};this.children=[];
	// 숫자 또는 숫자 다음 ch
	this.attr.Indent="0";
	this.attr.Left="0";
	this.attr.Right="0";
	this.attr.Prev="0";
	this.attr.Next="0";
	this.attr.LineSpacingType="Percent";
	this.attr.LineSpacing="160";
};
root.node.PARABORDER=function Node_PARABORDER(){
	this.name="PARABORDER";this.attr={};this.children=[];
	this.attr.BorderFill=null;
	this.attr.OffsetLeft=null;
	this.attr.OffsetRight=null;
	this.attr.OffsetTop=null;
	this.attr.OffsetBottom=null;
	this.attr.Connect="false";
	this.attr.IgnoreMargin="false";
};
// 4.3.8. 스타일 정보
root.node.STYLELIST=function Node_STYLELIST(){
	this.name="STYLELIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.STYLE=function Node_STYLE(){
	this.name="STYLE";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Type="Para";
	this.attr.Name=null;
	this.attr.EngName=null;
	this.attr.ParaShape=null;
	this.attr.CharShape=null;
	this.attr.NextStyle=null;
	// TODO: 아래 두 개 타입 찾기
	this.attr.LangId=null;
	this.attr.LockForm=null;
};
// 4.3.9. 메모 정보
root.node.MEMOSHAPELIST=function Node_MEMOSHAPELIST(){
	this.name="MEMOSHAPELIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.MEMO=function Node_MEMO(){
	this.name="MEMO";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Width="0";
	// TODO: enum 찾기
	this.attr.LineType=null;
	this.attr.LineColor=null;
	this.attr.FillColor=null;
	this.attr.ActiveColor=null;
	// TODO: 타입 찾기
	this.attr.MemoType=null;
};
// 5. 본문 엘리먼트
root.node.BODY=function Node_BODY(){
	this.name="BODY";this.attr={};this.children=[];
};
root.node.SECTION=function Node_SECTION(){
	this.name="SECTION";this.attr={};this.children=[];
	this.attr.Id=null;
};
root.node.P=function Node_P(){
	this.name="P";this.attr={};this.children=[];
	this.attr.ParaShape=null;
	this.attr.Style=null;
	this.attr.InstId=null;
	this.attr.PageBreak="false";
	this.attr.ColumnBreak="false";
};
root.node.TEXT=function Node_TEXT(){
	this.name="TEXT";this.attr={};this.children=[];
	this.attr.CharShape=null;
};
// 5.1. 글자 엘리먼트
root.node.CHAR=function Node_CHAR(){
	this.name="CHAR";this.attr={};this.children=[];
	this.attr.Style=null;
};
root.node.MARKPENBEGIN=function Node_MARKPENBEGIN(){
	this.name="MARKPENBEGIN";this.attr={};this.children=[];
	this.attr.Color=null;
};
root.node.MARKPENEND=function Node_MARKPENEND(){
	this.name="MARKPENEND";this.attr={};this.children=[];
};
root.node.TITLEMARK=function Node_TITLEMARK(){
	this.name="TITLEMARK";this.attr={};this.children=[];
	this.attr.Ignore=null;
};
root.node.TAB=function Node_TAB(){
	this.name="TAB";this.attr={};this.children=[];
};
root.node.LINEBREAK=function Node_LINEBREAK(){
	this.name="LINEBREAK";this.attr={};this.children=[];
};
// (SIC)
root.node.HYPEN=function Node_HYPEN(){
	this.name="HYPEN";this.attr={};this.children=[];
};
root.node.NBSPACE=function Node_NBSPACE(){
	this.name="NBSPACE";this.attr={};this.children=[];
};
root.node.FWSPACE=function Node_FWSPACE(){
	this.name="FWSPACE";this.attr={};this.children=[];
};
// 5.2. 구역 정의 엘리먼트
root.node.SECDEF=function Node_SECDEF(){
	this.name="SECDEF";this.attr={};this.children=[];
	this.attr.TextDirection="0";
	this.attr.SpaceColumns=null;
	// TODO: 글자 수일때에는?
	this.attr.TabStop="8000";
	this.attr.OutlineShape="1";
	this.attr.LineGrid="0";
	this.attr.CharGrid="0";
	this.attr.FirstBorder="false";
	this.attr.FirstFill="false";
	this.attr.ExtMasterpageCount="0";
	this.attr.MemoShapeId=null;
	// 우선 존재하는 값은 0임.
	this.attr.TextVerticalWidthHead=null;
};
root.node.PARAMETERSET=function Node_PARAMETERSET(){
	this.name="PARAMETERSET";this.attr={};this.children=[];
	this.attr.SetId=null;
	this.attr.Count=null;
};
root.node.PARAMETERARRAY=function Node_PARAMETERARRAY(){
	this.name="PARAMETERARRAY";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.ITEM=function Node_ITEM(){
	this.name="ITEM";this.attr={};this.children=[];
	this.attr.ItemId=null;
	this.attr.Type=null;
};
// 5.2.1. 시작 번호 정보
root.node.STARTNUMBER=function Node_STARTNUMBER(){
	this.name="STARTNUMBER";this.attr={};this.children=[];
	this.attr.PageStartsOn="Both";
	this.attr.Page="0";
	this.attr.Figure="0";
	this.attr.Table="0";
	this.attr.Equation="0";
};
// 5.2.2. 감추기 정보
root.node.HIDE=function Node_HIDE(){
	this.name="HIDE";this.attr={};this.children=[];
	this.attr.Header="false";
	this.attr.Footer="false";
	this.attr.MasterPage="false";
	this.attr.Border="false";
	this.attr.Fill="false";
	this.attr.PageNumPos="false";
	this.attr.EmptyLine="false";
};
// 5.2.3. 용지 설정 정보
root.node.PAGEDEF=function Node_PAGEDEF(){
	this.name="PAGEDEF";this.attr={};this.children=[];
	this.attr.Landscape="0";
	this.attr.Width="59528";
	this.attr.Height="84188";
	this.attr.GutterType="LeftOnly";
};
root.node.PAGEMARGIN=function Node_PAGEMARGIN(){
	this.name="PAGEMARGIN";this.attr={};this.children=[];
	this.attr.Left="8504";
	this.attr.Right="8504";
	this.attr.Top="5668";
	this.attr.Bottom="4252";
	this.attr.Header="4252";
	this.attr.Footer="4252";
	this.attr.Gutter="0";
};
// 5.2.4. 각주/미주 모양 정보
root.node.FOOTNOTESHAPE=function Node_FOOTNOTESHAPE(){
	this.name="FOOTNOTESHAPE";this.attr={};this.children=[];
};
root.node.ENDNOTESHAPE=function Node_ENDNOTESHAPE(){
	this.name="ENDNOTESHAPE";this.attr={};this.children=[];
};
root.node.AUTONUMFORMAT=function Node_AUTONUMFORMAT(){
	this.name="AUTONUMFORMAT";this.attr={};this.children=[];
	this.attr.Type="Digit";
	this.attr.UserChar=null;
	this.attr.PrefixChar=null;
	this.attr.SuffixChar=")";
	this.attr.Superscript=null;
};
root.node.NOTELINE=function Node_NOTELINE(){
	this.name="NOTELINE";this.attr={};this.children=[];
	this.attr.Length=null;
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color=null;
};
root.node.NOTESPACING=function Node_NOTESPACING(){
	this.name="NOTESPACING";this.attr={};this.children=[];
	this.attr.AboveLine=null;
	this.attr.BelowLine=null;
	this.attr.BetweenNotes=null;
};
root.node.NOTENUMBERING=function Node_NOTENUMBERING(){
	this.name="NOTENUMBERING";this.attr={};this.children=[];
	this.attr.Type="Continuous";
	// Type이 OnSection일 때에만 사용
	this.attr.NewNumber="1";
};
root.node.NOTEPLACEMENT=function Node_NOTEPLACEMENT(){
	this.name="NOTEPLACEMENT";this.attr={};this.children=[];
	// 부모에 따라 enum이 달라짐
	this.attr.Place=null;
	this.attr.BeneathText=null;
};
// 5.2.5. 쪽 테두리/배경 정보
root.node.PAGEBORDERFILL=function Node_PAGEBORDERFILL(){
	this.name="PAGEBORDERFILL";this.attr={};this.children=[];
	this.attr.Type="Both";
	this.attr.BorderFill=null;
	this.attr.TextBorder="false";
	this.attr.HeaderInside="false";
	this.attr.FooterInside="false";
	this.attr.FillArea="Paper";
};
root.node.PAGEOFFSET=function Node_PAGEOFFSET(){
	this.name="PAGEOFFSET";this.attr={};this.children=[];
	this.attr.Left="1417";
	this.attr.Right="1417";
	this.attr.Top="1417";
	this.attr.Bottom="1417";
};
// 5.2.6. 바탕쪽 정보
root.node.MASTERPAGE=function Node_MASTERPAGE(){
	this.name="MASTERPAGE";this.attr={};this.children=[];
	this.attr.Type="Both";
	this.attr.TextWidth=null;
	this.attr.TextHeight=null;
	this.attr.HasTextRef="false";
	this.attr.HasNumRef="false";
};
root.node.PARALIST=function Node_PARALIST(){
	this.name="PARALIST";this.attr={};this.children=[];
	this.attr.TextDirection="0";
	this.attr.LineWrap="Break";
	this.attr.VertAlign="Top";
	this.attr.LinkListID=null;
	this.attr.LinkListIDNext=null;
};
// 5.2.7. 확장 바탕쪽 정보
root.node.EXT_MASTERPAGE=function Node_EXT_MASTERPAGE(){
	this.name="EXT_MASTERPAGE";this.attr={};this.children=[];
	this.attr.Type=null;
	// Type이 OptionalPage일 때
	this.attr.PageNumber=null;
	this.attr.PageDuplicate=null;
	this.attr.PageFront=null;
};
// 5.3. 단 정의 정보
root.node.COLDEF=function Node_COLDEF(){
	this.name="COLDEF";this.attr={};this.children=[];
	this.attr.Type="Newspaper";
	this.attr.Count="1";
	this.attr.Layout="Left";
	this.attr.SameSize="false";
	this.attr.SameGap="0";
};
root.node.COLUMNLINE=function Node_COLUMNLINE(){
	this.name="COLUMNLINE";this.attr={};this.children=[];
	this.attr.Type="Solid";
	this.attr.Width="0.12mm";
	this.attr.Color=null;
};
root.node.COLUMNTABLE=function Node_COLUMNTABLE(){
	this.name="COLUMNTABLE";this.attr={};this.children=[];
};
root.node.COLUMN=function Node_COLUMN(){
	this.name="COLUMN";this.attr={};this.children=[];
	this.attr.Width=null;
	this.attr.Gap=null;
};
// 5.4. 표
root.node.TABLE=function Node_TABLE(){
	this.name="TABLE";this.attr={};this.children=[];
	this.attr.PageBreak="Cell";
	this.attr.RepeatHeader="true";
	this.attr.RowCount=null;
	this.attr.ColCount=null;
	this.attr.CellSpacing="0";
	this.attr.BorderFill=null;
};
root.node.SHAPEOBJECT=function Node_SHAPEOBJECT(){
	this.name="SHAPEOBJECT";this.attr={};this.children=[];
	this.attr.InstId=null;
	this.attr.ZOrder="0";
	this.attr.NumberingType="None";
	this.attr.TextWrap=null;
	this.attr.TextFlow="BothSides";
	this.attr.Lock="false";
};
root.node.SIZE=function Node_SIZE(){
	this.name="SIZE";this.attr={};this.children=[];
	this.attr.Width=null;
	this.attr.Height=null;
	this.attr.WidthRelTo="Absolute";
	this.attr.HeightRelTo="Absolute";
	this.attr.Protect="false";
};
root.node.POSITION=function Node_POSITION(){
	this.name="POSITION";this.attr={};this.children=[];
	this.attr.TreatAsChar=null;
	this.attr.AffectLSpacing="false";
	this.attr.VertRelTo=null;
	this.attr.VertAlign=null;
	this.attr.HorzRelTo=null;
	this.attr.HorzAlign=null;
	this.attr.VertOffset=null;
	this.attr.HorzOffset=null;
	this.attr.FlowWithText="false";
	this.attr.AllowOverlap="false";
	// 5.7.5.2992부터 추가된 속성
	this.attr.HoldAnchorAndSO="false";
};
root.node.OUTSIDEMARGIN=function Node_OUTSIDEMARGIN(){
	this.name="OUTSIDEMARGIN";this.attr={};this.children=[];
	// Table: 283, Equation: 56, Picture: 0, Drawing: 0, OLE: ?
	this.attr.Left=null;
	this.attr.Right=null;
	this.attr.Top=null;
	this.attr.Bottom=null;
};
root.node.CAPTION=function Node_CAPTION(){
	this.name="CAPTION";this.attr={};this.children=[];
	this.attr.Side="Left";
	this.attr.FullSize="false";
	this.attr.Width=null;
	this.attr.Gap=null;
	this.attr.LastWidth=null;
};
root.node.SHAPECOMMENT=function Node_SHAPECOMMENT(){
	this.name="SHAPECOMMENT";this.attr={};this.children=[];
};
root.node.INSIDEMARGIN=function Node_INSIDEMARGIN(){
	this.name="INSIDEMARGIN";this.attr={};this.children=[];
	// Table: 141, Picture: 0
	this.attr.Left=null;
	this.attr.Right=null;
	this.attr.Top=null;
	this.attr.Bottom=null;
};
root.node.CELLZONELIST=function Node_CELLZONELIST(){
	this.name="CELLZONELIST";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.CELLZONE=function Node_CELLZONE(){
	this.name="CELLZONE";this.attr={};this.children=[];
	this.attr.StartRowAddr=null;
	this.attr.StartColAddr=null;
	this.attr.EndRowAddr=null;
	this.attr.EndColAddr=null;
	this.attr.BorderFill=null;
};
root.node.ROW=function Node_ROW(){
	this.name="ROW";this.attr={};this.children=[];
};
root.node.CELL=function Node_CELL(){
	this.name="CELL";this.attr={};this.children=[];
	this.attr.Name=null;
	this.attr.ColAddr=null;
	this.attr.RowAddr=null;
	this.attr.ColSpan="1";
	this.attr.RowSpan="1";
	this.attr.Width=null;
	this.attr.Height=null;
	this.attr.Header="false";
	this.attr.HasMargin="false";
	this.attr.Protect="false";
	this.attr.Editable="false";
	this.attr.Dirty="false";
	this.attr.BorderFill=null;
};
root.node.CELLMARGIN=function Node_CELLMARGIN(){
	this.name="CELLMARGIN";this.attr={};this.children=[];
	this.attr.Left="0";
	this.attr.Right="0";
	this.attr.Top="0";
	this.attr.Bottom="0";
};
// 5.5. 그림
root.node.PICTURE=function Node_PICTURE(){
	this.name="PICTURE";this.attr={};this.children=[];
	this.attr.Reverse="false";
};
root.node.SHAPECOMPONENT=function Node_SHAPECOMPONENT(){
	this.name="SHAPECOMPONENT";this.attr={};this.children=[];
	// TODO: 타입 찾기
	this.attr.HRef=null;
	this.attr.XPos="0";
	this.attr.YPos="0";
	this.attr.GroupLevel="0";
	this.attr.OriWidth=null;
	this.attr.OriHeight=null;
	this.attr.CurWidth=null;
	this.attr.CurHeight=null;
	this.attr.HorzFlip="false";
	this.attr.VertFlip="false";
	// TODO: 정말 Int인지 확인하기
	this.attr.InstID=null;
};
root.node.ROTATIONINFO=function Node_ROTATIONINFO(){
	this.name="ROTATIONINFO";this.attr={};this.children=[];
	this.attr.Angle="0";
	// 기본값: 개체 가운데점
	this.attr.CenterX=null;
	this.attr.CenterY=null;
};
root.node.RENDERINGINFO=function Node_RENDERINGINFO(){
	this.name="RENDERINGINFO";this.attr={};this.children=[];
};
root.node.TRANSMATRIX=function Node_TRANSMATRIX(){
	this.name="TRANSMATRIX";this.attr={};this.children=[];
	this.attr.E1=null;
	this.attr.E2=null;
	this.attr.E3=null;
	this.attr.E4=null;
	this.attr.E5=null;
	this.attr.E6=null;
};
root.node.SCAMATRIX=function Node_SCAMATRIX(){
	this.name="SCAMATRIX";this.attr={};this.children=[];
	this.attr.E1=null;
	this.attr.E2=null;
	this.attr.E3=null;
	this.attr.E4=null;
	this.attr.E5=null;
	this.attr.E6=null;
};
root.node.ROTMATRIX=function Node_ROTMATRIX(){
	this.name="ROTMATRIX";this.attr={};this.children=[];
	this.attr.E1=null;
	this.attr.E2=null;
	this.attr.E3=null;
	this.attr.E4=null;
	this.attr.E5=null;
	this.attr.E6=null;
};
root.node.LINESHAPE=function Node_LINESHAPE(){
	this.name="LINESHAPE";this.attr={};this.children=[];
	this.attr.Color=null;
	this.attr.Width=null;
	this.attr.Style="Solid";
	this.attr.EndCap="Flat";
	this.attr.HeadStyle="Normal";
	this.attr.TailStyle="Normal";
	this.attr.HeadSize="SmallSmall";
	this.attr.TailSize="SmallSmall";
	this.attr.OutlineStyle="Normal";
	this.attr.Alpha=null;
};
root.node.IMAGERECT=function Node_IMAGERECT(){
	this.name="IMAGERECT";this.attr={};this.children=[];
	this.attr.X0=null;
	this.attr.Y0=null;
	this.attr.X1=null;
	this.attr.Y1=null;
	this.attr.X2=null;
	this.attr.Y2=null;
};
root.node.IMAGECLIP=function Node_IMAGECLIP(){
	this.name="IMAGECLIP";this.attr={};this.children=[];
	this.attr.Left=null;
	this.attr.Top=null;
	this.attr.Right=null;
	this.attr.Bottom=null;
};
root.node.EFFECTS=function Node_EFFECTS(){
	this.name="EFFECTS";this.attr={};this.children=[];
};
root.node.SHADOWEFFECT=function Node_SHADOWEFFECT(){
	this.name="SHADOWEFFECT";this.attr={};this.children=[];
	// TODO
};
root.node.GLOW=function Node_GLOW(){
	this.name="GLOW";this.attr={};this.children=[];
	this.attr.Alpha=null;
	this.attr.Radius=null;
};
root.node.SOFTEDGE=function Node_SOFTEDGE(){
	this.name="SOFTEDGE";this.attr={};this.children=[];
	this.attr.Radius=null;
};
root.node.REFLECTION=function Node_REFLECTION(){
	this.name="REFLECTION";this.attr={};this.children=[];
	// TODO
};
root.node.EFFECTSCOLOR=function Node_EFFECTSCOLOR(){
	this.name="EFFECTSCOLOR";this.attr={};this.children=[];
	// TODO
};
root.node.COLOREFFECT=function Node_COLOREFFECT(){
	this.name="COLOREFFECT";this.attr={};this.children=[];
	// TODO
};
// 5.6. 그리기 개체
root.node.DRAWINGOBJECT=function Node_DRAWINGOBJECT(){
	this.name="DRAWINGOBJECT";this.attr={};this.children=[];
};
root.node.DRAWTEXT=function Node_DRAWTEXT(){
	this.name="DRAWTEXT";this.attr={};this.children=[];
	this.attr.LastWidth=null;
	this.attr.Name=null;
	this.attr.Editable="false";
};
root.node.TEXTMARGIN=function Node_TEXTMARGIN(){
	this.name="TEXTMARGIN";this.attr={};this.children=[];
	this.attr.Left="238";
	this.attr.Right="238";
	this.attr.Top="238";
	this.attr.Bottom="238";
};
// 5.6.1. 선
root.node.LINE=function Node_LINE(){
	this.name="LINE";this.attr={};this.children=[];
	this.attr.StartX=null;
	this.attr.StartY=null;
	this.attr.EndX=null;
	this.attr.EndY=null;
	this.attr.IsReverseHV="false";
};
// 5.6.2. 사각형
root.node.RECTANGLE=function Node_RECTANGLE(){
	this.name="RECTANGLE";this.attr={};this.children=[];
	this.attr.Ratio=null;
	this.attr.X0=null;
	this.attr.Y0=null;
	this.attr.X1=null;
	this.attr.Y1=null;
	this.attr.X2=null;
	this.attr.Y2=null;
	// DOC: X3, Y3도 있음
	this.attr.X3=null;
	this.attr.Y3=null;
};
// 5.6.3. 타원
root.node.ELLIPSE=function Node_ELLIPSE(){
	this.name="ELLIPSE";this.attr={};this.children=[];
	this.attr.IntervalDirty="false";
	this.attr.HasArcProperty="false";
	this.attr.ArcType="Normal";
	this.attr.CenterX=null;
	this.attr.CenterY=null;
	this.attr.Axis1X=null;
	this.attr.Axis1Y=null;
	this.attr.Axis2X=null;
	this.attr.Axis2Y=null;
	this.attr.Start1X=null;
	this.attr.Start1Y=null;
	this.attr.End1X=null;
	this.attr.End1Y=null;
	this.attr.Start2X=null;
	this.attr.Start2Y=null;
	this.attr.End2X=null;
	this.attr.End2Y=null;
};
// 5.6.4. 호
root.node.ARC=function Node_ARC(){
	this.name="ARC";this.attr={};this.children=[];
	// 위 타원과 같은 enum?
	this.attr.Type="Normal";
	this.attr.CenterX=null;
	this.attr.CenterY=null;
	this.attr.Axis1X=null;
	this.attr.Axis1Y=null;
	this.attr.Axis2X=null;
	this.attr.Axis2Y=null;
};
// 5.6.5. 다각형
root.node.POLYGON=function Node_POLYGON(){
	this.name="POLYGON";this.attr={};this.children=[];
};
root.node.POINT=function Node_POINT(){
	this.name="POINT";this.attr={};this.children=[];
	this.attr.X=null;
	this.attr.Y=null;
};
// 5.6.6. 곡선
root.node.CURVE=function Node_CURVE(){
	this.name="CURVE";this.attr={};this.children=[];
};
root.node.SEGMENT=function Node_SEGMENT(){
	this.name="SEGMENT";this.attr={};this.children=[];
	this.attr.Type="Curve";
	this.attr.X1=null;
	this.attr.Y1=null;
	this.attr.X2=null;
	this.attr.Y2=null;
};
// 5.6.7. 연결선
root.node.CONNECTLINE=function Node_CONNECTLINE(){
	this.name="CONNECTLINE";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.StartX=null;
	this.attr.StartY=null;
	this.attr.EndX=null;
	this.attr.EndY=null;
	this.attr.StartSubjectID=null;
	this.attr.StartSubjectIndex=null;
	this.attr.EndSubjectID=null;
	this.attr.EndSubjectIndex=null;
};
// DOC: 문서에 없음
root.node.CONTROLPOINT=function Node_CONTROLPOINT(){
	this.name="CONTROLPOINT";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.X=null;
	this.attr.Y=null;
};
// 5.7. Unknown Object
root.node.UNKNOWNOBJECT=function Node_UNKNOWNOBJECT(){
	this.name="UNKNOWNOBJECT";this.attr={};this.children=[];
	this.attr.Ctrlid=null;
	// TODO_SOMETIME: CtrlId인지 확인하기
	this.attr.X0=null;
	this.attr.Y0=null;
	this.attr.X1=null;
	this.attr.Y1=null;
	this.attr.X2=null;
	this.attr.Y2=null;
	this.attr.X3=null;
	this.attr.Y3=null;
};
// 5.8. 양식 객체
root.node.FORMOBJECT=function Node_FORMOBJECT(){
	this.name="FORMOBJECT";this.attr={};this.children=[];
	this.attr.Name=null;
	this.attr.ForeColor=null;
	this.attr.BackColor=null;
	this.attr.GroupName=null;
	this.attr.TabStop="true";
	// TODO: 타입 찾기
	this.attr.TabOrder=null;
	this.attr.Enabled="true";
	this.attr.BorderType="0";
	this.attr.DrawFrame="true";
	this.attr.Printable="true";
};
root.node.FORMCHARSHAPE=function Node_FORMCHARSHAPE(){
	this.name="FORMCHARSHAPE";this.attr={};this.children=[];
	this.attr.CharShape="0";
	this.attr.FollowContext="false";
	this.attr.AutoSize="false";
	this.attr.WordWrap="false";
};
root.node.BUTTONSET=function Node_BUTTONSET(){
	this.name="BUTTONSET";this.attr={};this.children=[];
	// TODO: 타입 다 찾기
	this.attr.Caption=null;
	this.attr.Value=null;
	this.attr.RadioGroupName=null;
	this.attr.TriState=null;
	this.attr.BackStyle=null;
};
// 5.8.1. 라디오 버튼
root.node.RADIOBUTTON=function Node_RADIOBUTTON(){
	this.name="RADIOBUTTON";this.attr={};this.children=[];
};
// 5.8.2. 체크 버튼
root.node.CHECKBUTTON=function Node_CHECKBUTTON(){
	this.name="CHECKBUTTON";this.attr={};this.children=[];
};
// 5.8.3. 콤보 박스
root.node.COMBOBOX=function Node_COMBOBOX(){
	this.name="COMBOBOX";this.attr={};this.children=[];
	this.attr.ListBoxRows=null;
	this.attr.ListBoxWidth=null;
	this.attr.Text=null;
	// TODO: 정말 Boolean인지 확인하기
	this.attr.EditEnable=null;
};
// 5.8.4. 에디트
root.node.EDIT=function Node_EDIT(){
	this.name="EDIT";this.attr={};this.children=[];
	// TODO: 타입 다 찾기
	this.attr.MultiLine=null;
	this.attr.PasswordChar=null;
	this.attr.MaxLength=null;
	this.attr.ScrollBars=null;
	this.attr.TabKeyBehavior=null;
	// 아래 두 개는 Boolean 확실함.
	this.attr.Number=null;
	this.attr.ReadOnly=null;
	this.attr.AlignText=null;
};
root.node.EDITTEXT=function Node_EDITTEXT(){
	this.name="EDITTEXT";this.attr={};this.children=[];
};
// 5.8.5. 리스트 박스
root.node.LISTBOX=function Node_LISTBOX(){
	this.name="LISTBOX";this.attr={};this.children=[];
	// TODO
};
// 5.8.6. 스크롤바
root.node.SCROLLBAR=function Node_SCROLLBAR(){
	this.name="SCROLLBAR";this.attr={};this.children=[];
	// TODO
};
// 5.9. 묶음 객체
root.node.CONTAINER=function Node_CONTAINER(){
	this.name="CONTAINER";this.attr={};this.children=[];
};
// 5.10. OLE 객체
root.node.OLE=function Node_OLE(){
	this.name="OLE";this.attr={};this.children=[];
	// 오타 아님!
	this.attr.ObjetType=null;
	this.attr.ExtentX=null;
	this.attr.ExtentY=null;
	this.attr.BinItem=null;
	this.attr.DrawAspect=null;
	this.attr.HasMoniker="false";
	this.attr.EqBaseLine=null;
};
// 5.11. 한글 97 수식
root.node.EQUATION=function Node_EQUATION(){
	this.name="EQUATION";this.attr={};this.children=[];
	this.attr.LineMode="false";
	this.attr.BaseUnit="1000";
	this.attr.TextColor="0";
	this.attr.BaseLine=null;
	this.attr.Version=null;
};
root.node.SCRIPT=function Node_SCRIPT(){
	this.name="SCRIPT";this.attr={};this.children=[];
};
// 5.12. 글맵시
root.node.TEXTART=function Node_TEXTART(){
	this.name="TEXTART";this.attr={};this.children=[];
	this.attr.Text=null;
	this.attr.X0=null;
	this.attr.Y0=null;
	this.attr.X1=null;
	this.attr.Y1=null;
	this.attr.X2=null;
	this.attr.Y2=null;
	this.attr.X3=null;
	this.attr.Y3=null;
};
root.node.TEXTARTSHAPE=function Node_TEXTARTSHAPE(){
	this.name="TEXTARTSHAPE";this.attr={};this.children=[];
	this.attr.FontName=null;
	// TODO_SOMETIME: enum 찾기
	this.attr.FontStyle="Regular";
	// TODO: enum 정하기 (htf?)
	this.attr.FontType="ttf";
	this.attr.TextShape="0";
	this.attr.LineSpacing="120";
	this.attr.CharSpacing="100";
	this.attr.Align="Left";
};
root.node.OUTLINEDATA=function Node_OUTLINEDATA(){
	this.name="OUTLINEDATA";this.attr={};this.children=[];
	this.attr.Count=null;
};
// 5.13. 필드 시작
root.node.FILEDBEGIN=function Node_FILEDBEGIN(){
	this.name="FILEDBEGIN";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.Name=null;
	this.attr.InstId=null;
	this.attr.Editable="true";
	this.attr.Dirty="false";
	// TODO_SOMETIME: 타입 찾기
	this.attr.Property=null;
	this.attr.Command=null;
};
// 5.14. 필드 끝
root.node.FIELDEND=function Node_FIELDEND(){
	this.name="FIELDEND";this.attr={};this.children=[];
	this.attr.Type=null;
	this.attr.Editable="true";
	// TODO_SOMETIME: 타입 찾기
	this.attr.Property=null;
};
// 5.15. 책갈피
root.node.BOOKMARK=function Node_BOOKMARK(){
	this.name="BOOKMARK";this.attr={};this.children=[];
	this.attr.Name=null;
};
// 5.16. 머리말, 꼬리말
root.node.HEADER=function Node_HEADER(){
	this.name="HEADER";this.attr={};this.children=[];
	// TODO
};
root.node.FOOTER=function Node_FOOTER(){
	this.name="FOOTER";this.attr={};this.children=[];
	// TODO
};
// 5.17. 각주, 미주
root.node.FOOTNOTE=function Node_FOOTNOTE(){
	this.name="FOOTNOTE";this.attr={};this.children=[];
};
root.node.ENDNOTE=function Node_ENDNOTE(){
	this.name="ENDNOTE";this.attr={};this.children=[];
};
// 5.18. 자동 번호, 새 번호
root.node.AUTONUM=function Node_AUTONUM(){
	this.name="AUTONUM";this.attr={};this.children=[];
	// TODO
};
root.node.NEWNUM=function Node_NEWNUM(){
	this.name="NEWNUM";this.attr={};this.children=[];
	// TODO
};
// 5.19. 홀/짝수 조정
root.node.PAGENUMCTRL=function Node_PAGENUMCTRL(){
	this.name="PAGENUMCTRL";this.attr={};this.children=[];
	this.attr.PageStartsOn="Both";
};
// 5.20. 감추기
root.node.PAGEHIDING=function Node_PAGEHIDING(){
	this.name="PAGEHIDING";this.attr={};this.children=[];
	this.attr.HideHeader="false";
	this.attr.HideFooter="false";
	this.attr.HideMasterPage="false";
	this.attr.HideBorder="false";
	this.attr.HideFill="false";
	this.attr.HidePageNum="false";
};
// 5.21. 쪽번호 위치
root.node.PAGENUM=function Node_PAGENUM(){
	this.name="PAGENUM";this.attr={};this.children=[];
	this.attr.Pos="TopLeft";
	this.attr.FormatType="Digit";
	// TODO: 타입 찾기
	this.attr.SideChar=null;
};
// 5.22. 찾아보기 표식
root.node.INDEXMARK=function Node_INDEXMARK(){
	this.name="INDEXMARK";this.attr={};this.children=[];
};
root.node.KEYFIRST=function Node_KEYFIRST(){
	this.name="KEYFIRST";this.attr={};this.children=[];
};
root.node.KEYSECOND=function Node_KEYSECOND(){
	this.name="KEYSECOND";this.attr={};this.children=[];
};
// 5.23. 글자 겹침
root.node.COMPOSE=function Node_COMPOSE(){
	this.name="COMPOSE";this.attr={};this.children=[];
	// TODO
};
root.node.COMPCHARSHAPE=function Node_COMPCHARSHAPE(){
	this.name="COMPCHARSHAPE";this.attr={};this.children=[];
	this.attr.ShapeID=null;
};
// 5.24. 덧말
root.node.DUTMAL=function Node_DUTMAL(){
	this.name="DUTMAL";this.attr={};this.children=[];
	// TODO
};
root.node.MAINTEXT=function Node_MAINTEXT(){
	this.name="MAINTEXT";this.attr={};this.children=[];
};
root.node.SUBTEXT=function Node_SUBTEXT(){
	this.name="SUBTEXT";this.attr={};this.children=[];
};
// 5.25. 숨은 설명
root.node.HIDDENCOMMENT=function Node_HIDDENCOMMENT(){
	this.name="HIDDENCOMMENT";this.attr={};this.children=[];
};
// 6. 부가 정보 엘리먼트
root.node.TAIL=function Node_TAIL(){
	this.name="TAIL";this.attr={};this.children=[];
};
root.node.BINDATASTORAGE=function Node_BINDATASTORAGE(){
	this.name="BINDATASTORAGE";this.attr={};this.children=[];
};
root.node.BINDATA=function Node_BINDATA(){
	this.name="BINDATA";this.attr={};this.children=[];
	this.attr.Id=null;
	this.attr.Size=null;
	this.attr.Encoding="Base64";
	this.attr.Compress="true";
};
root.node.SCRIPTCODE=function Node_SCRIPTCODE(){
	this.name="SCRIPTCODE";this.attr={};this.children=[];
	this.attr.Type="JScript";
	this.attr.Version=null;
};
root.node.SCRIPTHEADER=function Node_SCRIPTHEADER(){
	this.name="SCRIPTHEADER";this.attr={};this.children=[];
};
root.node.SCRIPTSOURCE=function Node_SCRIPTSOURCE(){
	this.name="SCRIPTSOURCE";this.attr={};this.children=[];
};
root.node.PRESCRIPT=function Node_PRESCRIPT(){
	this.name="PRESCRIPT";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.POSTSCRIPT=function Node_POSTSCRIPT(){
	this.name="POSTSCRIPT";this.attr={};this.children=[];
	this.attr.Count=null;
};
root.node.SCRIPTFUNCTION=function Node_SCRIPTFUNCTION(){
	this.name="SCRIPTFUNCTION";this.attr={};this.children=[];
};
root.node.XMLTEMPLATE=function Node_XMLTEMPLATE(){
	this.name="XMLTEMPLATE";this.attr={};this.children=[];
};
root.node.SCHEMA=function Node_SCHEMA(){
	this.name="SCHEMA";this.attr={};this.children=[];
};
root.node.INSTANCE=function Node_INSTANCE(){
	this.name="INSTANCE";this.attr={};this.children=[];
};
root.node.COMPATIBLEDOCUMENT=function Node_COMPATIBLEDOCUMENT(){
	this.name="COMPATIBLEDOCUMENT";this.attr={};this.children=[];
	this.attr.TargetProgram="None";
};
root.node.LAYOUTCOMPATIBILITY=function Node_LAYOUTCOMPATIBILITY(){
	this.name="LAYOUTCOMPATIBILITY";this.attr={};this.children=[];
	this.attr.ApplyFontWeightToBold="false";
	this.attr.UseInnerUnderline="false";
	this.attr.FixedUnderlineWidth="false";
	this.attr.DoNotApplyStrikeout="false";
	this.attr.UseLowercaseStrikeout="false";
	this.attr.ExtendLineheightToOffset="false";
	this.attr.TreatQuotationAsLatin="false";
	this.attr.DoNotAlignWhitespaceOnRight="false";
	this.attr.DoNotAdjustWordInJustify="false";
	this.attr.BaseCharUnitOnEAsian="false";
	this.attr.BaseCharUnitOfIndentOnFirstChar="false";
	this.attr.AdjustLineheightToFont="false";
	this.attr.AdjustBaselineInFixedLinespacing="false";
	this.attr.ExcludeOverlappingParaSpacing="false";
	this.attr.ApplyNextspacingOfLastPara="false";
	this.attr.ApplyAtLeastToPercent100Pct="false";
	this.attr.DoNotApplyAutoSpaceEAsianEng="false";
	this.attr.DoNotApplyAutoSpaceEAsianNum="false";
	this.attr.AdjustParaBorderfillToSpacing="false";
	this.attr.ConnectParaBorderfillOfEqualBorder="false";
	this.attr.AdjustParaBorderOffsetWithBorder="false";
	this.attr.ExtendLineheightToParaBorderOffset="false";
	this.attr.ApplyParaBorderToOutside="false";
	this.attr.BaseLinespacingOnLinegrid="false";
	this.attr.ApplyCharSpacingToCharGrid="false";
	this.attr.DoNotApplyGridInHeaderfooter="false";
	this.attr.ExtendHeaderfooterToBody="false";
	this.attr.AdjustEndnotePositionToFootnote="false";
	this.attr.DoNotApplyImageEffect="false";
	this.attr.DoNotApplyShapeComment="false";
	this.attr.DoNotAdjustEmptyAnchorLine="false";
	this.attr.OverlapBothAllowOverlap="false";
	this.attr.DoNotApplyVertOffsetOfForward="false";
	this.attr.ExtendVertLimitToPageMargins="false";
	this.attr.DoNotHoldAnchorOfTable="false";
	this.attr.DoNotFormattingAtBeneathAnchor="false";
	this.attr.DoNotApplyExtensionCharCompose="false";
};
*/