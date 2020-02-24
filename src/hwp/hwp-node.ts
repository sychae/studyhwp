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
			attr.SecCnt=null;
			break;
		// 4.1. 문서 요약 정보 엘리먼트
		case 'DOCSUMMARY':
			break;
		case 'TITLE':
			break;
		case 'SUBJECT':
			break;
		case 'AUTHOR':
			break;
		case 'DATE':
			break;
		case 'KEYWORDS':
			break;
		case 'COMMENTS':
			break;
		case 'FORBIDDENSTRING':
			break;
		case 'FORBIDDEN':
			encoding="base64";
			attr.Id=null;
			break;
		// 4.2. 문서 설정 정보 엘리먼트
		case 'DOCSETTING':
			break;
		case 'BEGINNUMBER':
			attr.Page=null;
			attr.Footnote=null;
			attr.Endnote=null;
			attr.Picture=null;
			attr.Table=null;
			attr.Equation=null;
			attr.TotalPage=null;
			break;
		case 'CARETPOS':
			attr.List=null;
			attr.Para=null;
			attr.Pos=null;
			break;
		// 4.3. 문서 글꼴 / 스타일 정보
		case 'MAPPINGTABLE':
			break;
		// 4.3.1. 문서 내 그림 / OLE 정보
		case 'BINDATALIST':
			attr.Count="0";
			break;
		case 'BINITEM':
			attr.Type=null;
			attr.APath=null;
			attr.RPath=null;
			attr.BinData=null;
			attr.Format=null;
			break;
		// 4.3.2. 글꼴 정보
		case 'FACENAMELIST':
			break;
		case 'FONTFACE':
			attr.Lang=null;
			attr.Count=null;
			break;
		case 'FONT':
			attr.Id=null;
			attr.Type=null;
			attr.Name=null;
			break;
		case 'SUBSTFONT':
			attr.Type=null;
			attr.Name=null;
			break;
		case 'TYPEINFO':
			attr.FamilyType=null;
			attr.SerifStyle=null;
			attr.Weight=null;
			attr.Proportion=null;
			attr.Contrast=null;
			attr.StrokeVariation=null;
			attr.ArmStyle=null;
			attr.Letterform=null;
			attr.Midline=null;
			attr.XHeight=null;
			break;
		// 4.3.3. 테두리 / 배경 / 채우기 정보
		case 'BORDERFILLLIST':
			attr.Count=null;
			break;
		case 'BORDERFILL':
			attr.Id=null;
			attr.ThreeD="false";
			attr.Shadow="false";
			attr.Slash="0";
			attr.BackSlash="0";
			attr.CrookedSlash="0";
			attr.CounterSlash="0";
			attr.CounterBackSlash="0";
			attr.BreakCellSeparateLine="0";
			// 문서에 없음
			attr.CenterLine="0";
			break;
		case 'LEFTBORDER':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color="0";
			break;
		case 'RIGHTBORDER':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color="0";
			break;
		case 'TOPBORDER':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color="0";
			break;
		case 'BOTTOMBORDER':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color="0";
			break;
		case 'DIAGONAL':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color="0";
			break;
		case 'FILLBRUSH':
			break;
		case 'WINDOWBRUSH':
			attr.FaceColor=null;
			attr.HatchColor=null;
			attr.HatchStyle=null;
			attr.Alpha=null;
			break;
		case 'GRADATION':
			attr.Type=null;
			attr.Angle="90";
			attr.CenterX="0";
			attr.CenterY="0";
			attr.Step="50";
			attr.ColorNum="2";
			attr.StepCenter="50";
			attr.Alpha=null;
			break;
		case 'COLOR':
			attr.Value=null;
			break;
		case 'IMAGEBRUSH':
			attr.Mode="Tile";
			break;
		case 'IMAGE':
			attr.Bright="0";
			attr.Contrast="0";
			attr.Effect=null;
			attr.BinItem=null;
			attr.Alpha=null;
			break;
		// 4.3.4. 글자 모양 정보
		case 'CHARSHAPELIST':
			attr.Count=null;
			break;
		case 'CHARSHAPE':
			attr.Id=null;
			attr.Height="1000";
			attr.TextColor="0";
			attr.ShadeColor="4294967295";
			attr.UseFontSpace="false";
			attr.UseKerning="false";
			attr.SymMark="0";
			attr.BorderFillId=null;
			break;
		case 'FONTID':
			attr.Hangul=null;
			attr.Latin=null;
			attr.Hanja=null;
			attr.Japanese=null;
			attr.Other=null;
			attr.Symbol=null;
			attr.User=null;
			break;
		case 'RATIO':
			attr.Hangul="100";
			attr.Latin="100";
			attr.Hanja="100";
			attr.Japanese="100";
			attr.Other="100";
			attr.Symbol="100";
			attr.User="100";
			break;
		case 'CHARSPACING':
			attr.Hangul="0";
			attr.Latin="0";
			attr.Hanja="0";
			attr.Japanese="0";
			attr.Other="0";
			attr.Symbol="0";
			attr.User="0";
			break;
		case 'RELSIZE':
			attr.Hangul="100";
			attr.Latin="100";
			attr.Hanja="100";
			attr.Japanese="100";
			attr.Other="100";
			attr.Symbol="100";
			attr.User="100";
			break;
		case 'CHAROFFSET':
			attr.Hangul="0";
			attr.Latin="0";
			attr.Hanja="0";
			attr.Japanese="0";
			attr.Other="0";
			attr.Symbol="0";
			attr.User="0";
			break;
		case 'ITALIC':
			break;
		case 'BOLD':
			break;
		case 'UNDERLINE':
			attr.Type="Bottom";
			attr.Shape="Solid";
			attr.Color="0";
			break;
		case 'STRIKEOUT':
			attr.Type="Continuous";
			attr.Shape="Solid";
			attr.Color="0";
			break;
		case 'OUTLINE':
			attr.Type="Solid";
			break;
		case 'SHADOW':
			attr.Type=null;
			attr.Color=null;
			attr.OffsetX="10";
			attr.OffsetY="10";
			attr.Alpha=null;
			break;
		case 'EMBOSS':
			break;
		case 'ENGRAVE':
			break;
		case 'SUPERSCRIPT':
			break;
		case 'SUBSCRIPT':
			break;
		// 4.3.5. 탭 정보
		case 'TABDEFLIST':
			attr.Count=null;
			break;
		case 'TABDEF':
			attr.Id=null;
			attr.AutoTabLeft="false";
			attr.AutoTabRight="false";
			break;
		case 'TABITEM':
			attr.Pos=null;
			attr.Type="Left";
			attr.Leader="Solid";
			break;
		case 'NUMBERINGLIST':
			attr.Count=null;
			break;
		case 'NUMBERING':
			attr.Id=null;
			attr.Start="1";
			break;
		case 'PARAHEAD':
			attr.Level=null;
			attr.Alignment="Left";
			attr.UseInstWidth="true";
			attr.AutoIndent="true";
			attr.WidthAdjust="0";
			attr.TextOffsetType="percent";
			attr.TextOffset="50";
			attr.NumFormat="Digit";
			attr.CharShape=null;
			break;
		// 4.3.6. 글머리표 정보
		case 'BULLETLIST':
			attr.Count=null;
			break;
		case 'BULLET':
			attr.Id=null;
			attr.Char=null;
			attr.Image="false";
			break;
		// 4.3.7. 문단 모양 정보
		case 'PARASHAPELIST':
			attr.Count=null;
			break;
		case 'PARASHAPE':
			attr.Id=null;
			attr.Align="Justify";
			attr.VerAlign="Baseline";
			attr.HeadingType="None";
			attr.Heading=null;
			attr.Level="0";
			attr.TabDef=null;
			attr.BreakLatinWord="KeepWord";
			attr.BreakNonLatinWord="true";
			attr.Condense="0";
			attr.WidowOrphan="false";
			attr.KeepWithNext="false";
			attr.KeepLines="false";
			attr.PageBreakBefore="false";
			attr.FontLineHeight="false";
			attr.SnapToGrid="true";
			attr.LineWrap="break";
			attr.AutoSpaceEAsianEng="true";
			attr.AutoSpaceEAsianNum="true";
			break;
		case 'PARAMARGIN':
			// 숫자 또는 숫자 다음 ch
			attr.Indent="0";
			attr.Left="0";
			attr.Right="0";
			attr.Prev="0";
			attr.Next="0";
			attr.LineSpacingType="Percent";
			attr.LineSpacing="160";
			break;
		case 'PARABORDER':
			attr.BorderFill=null;
			attr.OffsetLeft=null;
			attr.OffsetRight=null;
			attr.OffsetTop=null;
			attr.OffsetBottom=null;
			attr.Connect="false";
			attr.IgnoreMargin="false";
			break;
		// 4.3.8. 스타일 정보
		case 'STYLELIST':
			attr.Count=null;
			break;
		case 'STYLE':
			attr.Id=null;
			attr.Type="Para";
			attr.Name=null;
			attr.EngName=null;
			attr.ParaShape=null;
			attr.CharShape=null;
			attr.NextStyle=null;
			// TODO: 아래 두 개 타입 찾기
			attr.LangId=null;
			attr.LockForm=null;
			break;
		// 4.3.9. 메모 정보
		case 'MEMOSHAPELIST':
			attr.Count=null;
			break;
		case 'MEMO':
			attr.Id=null;
			attr.Width="0";
			// TODO: enum 찾기
			attr.LineType=null;
			attr.LineColor=null;
			attr.FillColor=null;
			attr.ActiveColor=null;
			// TODO: 타입 찾기
			attr.MemoType=null;
			break;
		// 5. 본문 엘리먼트
		case 'BODY':
			break;
		case 'SECTION':
			attr.Id=null;
			break;
		case 'P':
			attr.ParaShape=null;
			attr.Style=null;
			attr.InstId=null;
			attr.PageBreak="false";
			attr.ColumnBreak="false";
			break;
		case 'TEXT':
			attr.CharShape=null;
			break;
		// 5.1. 글자 엘리먼트
		case 'CHAR':
			attr.Style=null;
			break;
		case 'MARKPENBEGIN':
			attr.Color=null;
			break;
		case 'MARKPENEND':
			break;
		case 'TITLEMARK':
			attr.Ignore=null;
			break;
		case 'TAB':
			break;
		case 'LINEBREAK':
			break;
		case 'HYPEN':
			break;
		case 'NBSPACE':
			break;
		case 'FWSPACE':
			break;
		// 5.2. 구역 정의 엘리먼트
		case 'SECDEF':
			attr.TextDirection="0";
			attr.SpaceColumns=null;
			// TODO: 글자 수일때에는?
			attr.TabStop="8000";
			attr.OutlineShape="1";
			attr.LineGrid="0";
			attr.CharGrid="0";
			attr.FirstBorder="false";
			attr.FirstFill="false";
			attr.ExtMasterpageCount="0";
			attr.MemoShapeId=null;
			// 우선 존재하는 값은 0임.
			attr.TextVerticalWidthHead=null;
			break;
		case 'PARAMETERSET':
			attr.SetId=null;
			attr.Count=null;
			break;
		case 'PARAMETERARRAY':
			attr.Count=null;
			break;
		case 'ITEM':
			attr.ItemId=null;
			attr.Type=null;
			break;
		// 5.2.1. 시작 번호 정보
		case 'STARTNUMBER':
			attr.PageStartsOn="Both";
			attr.Page="0";
			attr.Figure="0";
			attr.Table="0";
			attr.Equation="0";
			break;
		// 5.2.2. 감추기 정보
		case 'HIDE':
			attr.Header="false";
			attr.Footer="false";
			attr.MasterPage="false";
			attr.Border="false";
			attr.Fill="false";
			attr.PageNumPos="false";
			attr.EmptyLine="false";
			break;
		// 5.2.3. 용지 설정 정보
		case 'PAGEDEF':
			attr.Landscape="0";
			attr.Width="59528";
			attr.Height="84188";
			attr.GutterType="LeftOnly";
			break;
		case 'PAGEMARGIN':
			attr.Left="8504";
			attr.Right="8504";
			attr.Top="5668";
			attr.Bottom="4252";
			attr.Header="4252";
			attr.Footer="4252";
			attr.Gutter="0";
			break;
		// 5.2.4. 각주/미주 모양 정보
		case 'FOOTNOTESHAPE':
			break;
		case 'ENDNOTESHAPE':
			break;
		case 'AUTONUMFORMAT':
			attr.Type="Digit";
			attr.UserChar=null;
			attr.PrefixChar=null;
			attr.SuffixChar=")";
			attr.Superscript=null;
			break;
		case 'NOTELINE':
			attr.Length=null;
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color=null;
			break;
		case 'NOTESPACING':
			attr.AboveLine=null;
			attr.BelowLine=null;
			attr.BetweenNotes=null;
			break;
		case 'NOTENUMBERING':
			attr.Type="Continuous";
			// Type이 OnSection일 때에만 사용
			attr.NewNumber="1";
			break;
		case 'NOTEPLACEMENT':
			// 부모에 따라 enum이 달라짐
			attr.Place=null;
			attr.BeneathText=null;
			break;
		// 5.2.5. 쪽 테두리/배경 정보
		case 'PAGEBORDERFILL':
			attr.Type="Both";
			attr.BorderFill=null;
			attr.TextBorder="false";
			attr.HeaderInside="false";
			attr.FooterInside="false";
			attr.FillArea="Paper";
			break;
		case 'PAGEOFFSET':
			attr.Left="1417";
			attr.Right="1417";
			attr.Top="1417";
			attr.Bottom="1417";
			break;
		// 5.2.6. 바탕쪽 정보
		case 'MASTERPAGE':
			attr.Type="Both";
			attr.TextWidth=null;
			attr.TextHeight=null;
			attr.HasTextRef="false";
			attr.HasNumRef="false";
			break;
		case 'PARALIST':
			attr.TextDirection="0";
			attr.LineWrap="Break";
			attr.VertAlign="Top";
			attr.LinkListID=null;
			attr.LinkListIDNext=null;
			break;
		// 5.2.7. 확장 바탕쪽 정보
		case 'EXT_MASTERPAGE':
			attr.Type=null;
			// Type이 OptionalPage일 때
			attr.PageNumber=null;
			attr.PageDuplicate=null;
			attr.PageFront=null;
			break;
		// 5.3. 단 정의 정보
		case 'COLDEF':
			attr.Type="Newspaper";
			attr.Count="1";
			attr.Layout="Left";
			attr.SameSize="false";
			attr.SameGap="0";
			break;
		case 'COLUMNLINE':
			attr.Type="Solid";
			attr.Width="0.12mm";
			attr.Color=null;
			break;
		case 'COLUMNTABLE':
			break;
		case 'COLUMN':
			attr.Width=null;
			attr.Gap=null;
			break;
		// 5.4. 표
		case 'TABLE':
			attr.PageBreak="Cell";
			attr.RepeatHeader="true";
			attr.RowCount=null;
			attr.ColCount=null;
			attr.CellSpacing="0";
			attr.BorderFill=null;
			break;
		case 'SHAPEOBJECT':
			attr.InstId=null;
			attr.ZOrder="0";
			attr.NumberingType="None";
			attr.TextWrap=null;
			attr.TextFlow="BothSides";
			attr.Lock="false";
			break;
		case 'SIZE':
			attr.Width=null;
			attr.Height=null;
			attr.WidthRelTo="Absolute";
			attr.HeightRelTo="Absolute";
			attr.Protect="false";
			break;
		case 'POSITION':
			attr.TreatAsChar=null;
			attr.AffectLSpacing="false";
			attr.VertRelTo=null;
			attr.VertAlign=null;
			attr.HorzRelTo=null;
			attr.HorzAlign=null;
			attr.VertOffset=null;
			attr.HorzOffset=null;
			attr.FlowWithText="false";
			attr.AllowOverlap="false";
			// 5.7.5.2992부터 추가된 속성
			attr.HoldAnchorAndSO="false";
			break;
		case 'OUTSIDEMARGIN':
			attr.Left=null;
			attr.Right=null;
			attr.Top=null;
			attr.Bottom=null;
			break;
		case 'CAPTION':
			attr.Side="Left";
			attr.FullSize="false";
			attr.Width=null;
			attr.Gap=null;
			attr.LastWidth=null;
			break;
		case 'SHAPECOMMENT':
			break;
		case 'INSIDEMARGIN':
			attr.Left=null;
			attr.Right=null;
			attr.Top=null;
			attr.Bottom=null;
			break;
		case 'CELLZONELIST':
			attr.Count=null;
			break;
		case 'CELLZONE':
			attr.StartRowAddr=null;
			attr.StartColAddr=null;
			attr.EndRowAddr=null;
			attr.EndColAddr=null;
			attr.BorderFill=null;
			break;
		case 'ROW':
			break;
		case 'CELL':
			attr.Name=null;
			attr.ColAddr=null;
			attr.RowAddr=null;
			attr.ColSpan="1";
			attr.RowSpan="1";
			attr.Width=null;
			attr.Height=null;
			attr.Header="false";
			attr.HasMargin="false";
			attr.Protect="false";
			attr.Editable="false";
			attr.Dirty="false";
			attr.BorderFill=null;
			break;
		case 'CELLMARGIN':
			attr.Left="0";
			attr.Right="0";
			attr.Top="0";
			attr.Bottom="0";
			break;
		// 5.5. 그림
		case 'PICTURE':
			attr.Reverse="false";
			break;
		case 'SHAPECOMPONENT':
			// TODO: 타입 찾기
			attr.HRef=null;
			attr.XPos="0";
			attr.YPos="0";
			attr.GroupLevel="0";
			attr.OriWidth=null;
			attr.OriHeight=null;
			attr.CurWidth=null;
			attr.CurHeight=null;
			attr.HorzFlip="false";
			attr.VertFlip="false";
			// TODO: 정말 Int인지 확인하기
			attr.InstID=null;
			break;
		case 'ROTATIONINFO':
			attr.Angle="0";
			// 기본값: 개체 가운데점
			attr.CenterX=null;
			attr.CenterY=null;
			break;
		case 'RENDERINGINFO':
			break;
		case 'TRANSMATRIX':
			attr.E1=null;
			attr.E2=null;
			attr.E3=null;
			attr.E4=null;
			attr.E5=null;
			attr.E6=null;
			break;
		case 'SCAMATRIX':
			attr.E1=null;
			attr.E2=null;
			attr.E3=null;
			attr.E4=null;
			attr.E5=null;
			attr.E6=null;
			break;
		case 'ROTMATRIX':
			attr.E1=null;
			attr.E2=null;
			attr.E3=null;
			attr.E4=null;
			attr.E5=null;
			attr.E6=null;
			break;
		case 'LINESHAPE':
			attr.Color=null;
			attr.Width=null;
			attr.Style="Solid";
			attr.EndCap="Flat";
			attr.HeadStyle="Normal";
			attr.TailStyle="Normal";
			attr.HeadSize="SmallSmall";
			attr.TailSize="SmallSmall";
			attr.OutlineStyle="Normal";
			attr.Alpha=null;
			break;
		case 'IMAGERECT':
			attr.X0=null;
			attr.Y0=null;
			attr.X1=null;
			attr.Y1=null;
			attr.X2=null;
			attr.Y2=null;
			break;
		case 'IMAGECLIP':
			attr.Left=null;
			attr.Top=null;
			attr.Right=null;
			attr.Bottom=null;
			break;
		case 'EFFECTS':
			break;
		case 'SHADOWEFFECT':
			break;
		case 'GLOW':
			attr.Alpha=null;
			attr.Radius=null;
			break;
		case 'SOFTEDGE':
			attr.Radius=null;
			break;
		case 'REFLECTION':
			break;
		case 'EFFECTSCOLOR':
			break;
		case 'COLOREFFECT':
			break;
		// 5.6. 그리기 개체
		case 'DRAWINGOBJECT':
			break;
		case 'DRAWTEXT':
			attr.LastWidth=null;
			attr.Name=null;
			attr.Editable="false";
			break;
		case 'TEXTMARGIN':
			attr.Left="238";
			attr.Right="238";
			attr.Top="238";
			attr.Bottom="238";
			break;
		// 5.6.1. 선
		case 'LINE':
			attr.StartX=null;
			attr.StartY=null;
			attr.EndX=null;
			attr.EndY=null;
			attr.IsReverseHV="false";
			break;
		// 5.6.2. 사각형
		case 'RECTANGLE':
			attr.Ratio=null;
			attr.X0=null;
			attr.Y0=null;
			attr.X1=null;
			attr.Y1=null;
			attr.X2=null;
			attr.Y2=null;
			// DOC: X3, Y3도 있음
			attr.X3=null;
			attr.Y3=null;
			break;
		// 5.6.3. 타원
		case 'ELLIPSE':
			attr.IntervalDirty="false";
			attr.HasArcProperty="false";
			attr.ArcType="Normal";
			attr.CenterX=null;
			attr.CenterY=null;
			attr.Axis1X=null;
			attr.Axis1Y=null;
			attr.Axis2X=null;
			attr.Axis2Y=null;
			attr.Start1X=null;
			attr.Start1Y=null;
			attr.End1X=null;
			attr.End1Y=null;
			attr.Start2X=null;
			attr.Start2Y=null;
			attr.End2X=null;
			attr.End2Y=null;
			break;
		// 5.6.4. 호
		case 'ARC':
			// 위 타원과 같은 enum?
			attr.Type="Normal";
			attr.CenterX=null;
			attr.CenterY=null;
			attr.Axis1X=null;
			attr.Axis1Y=null;
			attr.Axis2X=null;
			attr.Axis2Y=null;
		// 5.6.5. 다각형
		case 'POLYGON':
			break;
		case 'POINT':
			attr.X=null;
			attr.Y=null;
			break;
		// 5.6.6. 곡선
		case 'CURVE':
			break;
		case 'SEGMENT':
			attr.Type="Curve";
			attr.X1=null;
			attr.Y1=null;
			attr.X2=null;
			attr.Y2=null;
			break;
		// 5.6.7. 연결선
		case 'CONNECTLINE':
			attr.Type=null;
			attr.StartX=null;
			attr.StartY=null;
			attr.EndX=null;
			attr.EndY=null;
			attr.StartSubjectID=null;
			attr.StartSubjectIndex=null;
			attr.EndSubjectID=null;
			attr.EndSubjectIndex=null;
			break;
		// DOC: 문서에 없음
		case 'CONTROLPOINT':
			attr.Type=null;
			attr.X=null;
			attr.Y=null;
			break;
		// 5.7. Unknown Object
		case 'UNKNOWNOBJECT':
			attr.Ctrlid=null;
			// TODO_SOMETIME: CtrlId인지 확인하기
			attr.X0=null;
			attr.Y0=null;
			attr.X1=null;
			attr.Y1=null;
			attr.X2=null;
			attr.Y2=null;
			attr.X3=null;
			attr.Y3=null;
			break;
		// 5.8. 양식 객체
		case 'FORMOBJECT':
			attr.Name=null;
			attr.ForeColor=null;
			attr.BackColor=null;
			attr.GroupName=null;
			attr.TabStop="true";
			// TODO: 타입 찾기
			attr.TabOrder=null;
			attr.Enabled="true";
			attr.BorderType="0";
			attr.DrawFrame="true";
			attr.Printable="true";
			break;
		case 'FORMCHARSHAPE':
			attr.CharShape="0";
			attr.FollowContext="false";
			attr.AutoSize="false";
			attr.WordWrap="false";
			break;
		case 'BUTTONSET':
			// TODO: 타입 다 찾기
			attr.Caption=null;
			attr.Value=null;
			attr.RadioGroupName=null;
			attr.TriState=null;
			attr.BackStyle=null;
			break;
		// 5.8.1. 라디오 버튼
		case 'RADIOBUTTON':
			break;
		// 5.8.2. 체크 버튼
		case 'CHECKBUTTON':
			break;
		// 5.8.3. 콤보 박스
		case 'COMBOBOX':
			attr.ListBoxRows=null;
			attr.ListBoxWidth=null;
			attr.Text=null;
			// TODO: 정말 Boolean인지 확인하기
			attr.EditEnable=null;
			break;
		// 5.8.4. 에디트
		case 'EDIT':
			// TODO: 타입 다 찾기
			attr.MultiLine=null;
			attr.PasswordChar=null;
			attr.MaxLength=null;
			attr.ScrollBars=null;
			attr.TabKeyBehavior=null;
			// 아래 두 개는 Boolean 확실함.
			attr.Number=null;
			attr.ReadOnly=null;
			attr.AlignText=null;
			break;
		case 'EDITTEXT':
			break;
		// 5.8.5. 리스트 박스
		case 'LISTBOX':
			break;
		// 5.8.6. 스크롤바
		case 'SCROLLBAR':
			break;
		// 5.9. 묶음 객체
		case 'CONTAINER':
			break;
		// 5.10. OLE 객체
		case 'OLE':
			// 오타 아님!
			attr.ObjetType=null;
			attr.ExtentX=null;
			attr.ExtentY=null;
			attr.BinItem=null;
			attr.DrawAspect=null;
			attr.HasMoniker="false";
			attr.EqBaseLine=null;
			break;
		// 5.11. 한글 97 수식
		case 'EQUATION':
			attr.LineMode="false";
			attr.BaseUnit="1000";
			attr.TextColor="0";
			attr.BaseLine=null;
			attr.Version=null;
			break;
		case 'SCRIPT':
			break;
		// 5.12. 글맵시
		case 'TEXTART':
			attr.Text=null;
			attr.X0=null;
			attr.Y0=null;
			attr.X1=null;
			attr.Y1=null;
			attr.X2=null;
			attr.Y2=null;
			attr.X3=null;
			attr.Y3=null;
			break;
		case 'TEXTARTSHAPE':
			attr.FontName=null;
			// TODO_SOMETIME: enum 찾기
			attr.FontStyle="Regular";
			// TODO: enum 정하기 (htf?)
			attr.FontType="ttf";
			attr.TextShape="0";
			attr.LineSpacing="120";
			attr.CharSpacing="100";
			attr.Align="Left";
			break;
		case 'OUTLINEDATA':
			attr.Count=null;
			break;
		// 5.13. 필드 시작
		case 'FILEDBEGIN':
			attr.Type=null;
			attr.Name=null;
			attr.InstId=null;
			attr.Editable="true";
			attr.Dirty="false";
			// TODO_SOMETIME: 타입 찾기
			attr.Property=null;
			attr.Command=null;
			break;
		// 5.14. 필드 끝
		case 'FIELDEND':
			attr.Type=null;
			attr.Editable="true";
			// TODO_SOMETIME: 타입 찾기
			attr.Property=null;
			break;
		// 5.15. 책갈피
		case 'BOOKMARK':
			attr.Name=null;
			break;
		// 5.16. 머리말, 꼬리말
		case 'HEADER':
			break;
		case 'FOOTER':
			break;
		// 5.17. 각주, 미주
		case 'FOOTNOTE':
			break;
		case 'ENDNOTE':
		// 5.18. 자동 번호, 새 번호
		case 'AUTONUM':
			break;
		case 'NEWNUM':
			break;
		// 5.19. 홀/짝수 조정
		case 'PAGENUMCTRL':
			attr.PageStartsOn="Both";
			break;
		// 5.20. 감추기// 5.20. 감추기
		case 'PAGEHIDING':
			attr.HideHeader="false";
			attr.HideFooter="false";
			attr.HideMasterPage="false";
			attr.HideBorder="false";
			attr.HideFill="false";
			attr.HidePageNum="false";
			break;
		// 5.21. 쪽번호 위치
		case 'PAGENUM':
			attr.Pos="TopLeft";
			attr.FormatType="Digit";
			// TODO: 타입 찾기
			attr.SideChar=null;
			break;
		// 5.22. 찾아보기 표식
		case 'INDEXMARK':
			break;
		case 'KEYFIRST':
			break;
		case 'KEYSECOND':
			break;
		// 5.23. 글자 겹침
		case 'COMPOSE':
			break;
		case 'COMPCHARSHAPE':
			attr.ShapeID=null;
			break;
		// 5.24. 덧말
		case 'DUTMAL':
			break;
		case 'MAINTEXT':
			break;
		case 'SUBTEXT':
			break;
		// 5.25. 숨은 설명
		case 'HIDDENCOMMENT':
			break;
		// 6. 부가 정보 엘리먼트
		case 'TAIL':
			break;
		case 'BINDATASTORAGE':
			break;
		case 'BINDATA':
			attr.Id=null;
			attr.Size=null;
			attr.Encoding="Base64";
			attr.Compress="true";
			break;
		case 'SCRIPTCODE':
			attr.Type="JScript";
			attr.Version=null;
			break;
		case 'SCRIPTHEADER':
			break;
		case 'SCRIPTSOURCE':
			break;
		case 'PRESCRIPT':
			attr.Count=null;
			break;
		case 'POSTSCRIPT':
			attr.Count=null;
			break;
		case 'SCRIPTFUNCTION':
			break;
		case 'XMLTEMPLATE':
			break;
		case 'SCHEMA':
			break;
		case 'INSTANCE':
			break;
		case 'COMPATIBLEDOCUMENT':
			attr.TargetProgram="None";
			break;
		case 'LAYOUTCOMPATIBILITY':
			attr.ApplyFontWeightToBold="false";
			attr.UseInnerUnderline="false";
			attr.FixedUnderlineWidth="false";
			attr.DoNotApplyStrikeout="false";
			attr.UseLowercaseStrikeout="false";
			attr.ExtendLineheightToOffset="false";
			attr.TreatQuotationAsLatin="false";
			attr.DoNotAlignWhitespaceOnRight="false";
			attr.DoNotAdjustWordInJustify="false";
			attr.BaseCharUnitOnEAsian="false";
			attr.BaseCharUnitOfIndentOnFirstChar="false";
			attr.AdjustLineheightToFont="false";
			attr.AdjustBaselineInFixedLinespacing="false";
			attr.ExcludeOverlappingParaSpacing="false";
			attr.ApplyNextspacingOfLastPara="false";
			attr.ApplyAtLeastToPercent100Pct="false";
			attr.DoNotApplyAutoSpaceEAsianEng="false";
			attr.DoNotApplyAutoSpaceEAsianNum="false";
			attr.AdjustParaBorderfillToSpacing="false";
			attr.ConnectParaBorderfillOfEqualBorder="false";
			attr.AdjustParaBorderOffsetWithBorder="false";
			attr.ExtendLineheightToParaBorderOffset="false";
			attr.ApplyParaBorderToOutside="false";
			attr.BaseLinespacingOnLinegrid="false";
			attr.ApplyCharSpacingToCharGrid="false";
			attr.DoNotApplyGridInHeaderfooter="false";
			attr.ExtendHeaderfooterToBody="false";
			attr.AdjustEndnotePositionToFootnote="false";
			attr.DoNotApplyImageEffect="false";
			attr.DoNotApplyShapeComment="false";
			attr.DoNotAdjustEmptyAnchorLine="false";
			attr.OverlapBothAllowOverlap="false";
			attr.DoNotApplyVertOffsetOfForward="false";
			attr.ExtendVertLimitToPageMargins="false";
			attr.DoNotHoldAnchorOfTable="false";
			attr.DoNotFormattingAtBeneathAnchor="false";
			attr.DoNotApplyExtensionCharCompose="false"
			break;
		default:

	}

	return new HWPNode(name, attr, encoding);
}
/*

root.node.HEAD=function Node_HEAD(){
	this.name="HEAD";attr={};this.children=[];
	attr.SecCnt=null;
};
// 4.1. 문서 요약 정보 엘리먼트
root.node.DOCSUMMARY=function Node_DOCSUMMARY(){
	this.name="DOCSUMMARY";attr={};this.children=[];
};
root.node.TITLE=function Node_TITLE(){
	this.name="TITLE";attr={};this.children=[];
};
root.node.SUBJECT=function Node_SUBJECT(){
	this.name="SUBJECT";attr={};this.children=[];
};
root.node.AUTHOR=function Node_AUTHOR(){
	this.name="AUTHOR";attr={};this.children=[];
};
root.node.DATE=function Node_DATE(){
	this.name="DATE";attr={};this.children=[];
};
root.node.KEYWORDS=function Node_KEYWORDS(){
	this.name="KEYWORDS";attr={};this.children=[];
};
root.node.COMMENTS=function Node_COMMENTS(){
	this.name="COMMENTS";attr={};this.children=[];
};
root.node.FORBIDDENSTRING=function Node_FORBIDDENSTRING(){
	this.name="FORBIDDENSTRING";attr={};this.children=[];
};
root.node.FORBIDDEN=function Node_FORBIDDEN(){
	this.name="FORBIDDEN";attr={};this.children=[];
	this.encoding="base64";
	attr.Id=null;
};
// 4.2. 문서 설정 정보 엘리먼트
root.node.DOCSETTING=function Node_DOCSETTING(){
	this.name="DOCSETTING";attr={};this.children=[];
};
root.node.BEGINNUMBER=function Node_BEGINNUMBER(){
	this.name="BEGINNUMBER";attr={};this.children=[];
	attr.Page=null;
	attr.Footnote=null;
	attr.Endnote=null;
	attr.Picture=null;
	attr.Table=null;
	attr.Equation=null;
	attr.TotalPage=null;
};
root.node.CARETPOS=function Node_CARETPOS(){
	this.name="CARETPOS";attr={};this.children=[];
	attr.List=null;
	attr.Para=null;
	attr.Pos=null;
};
// 4.3. 문서 글꼴 / 스타일 정보
root.node.MAPPINGTABLE=function Node_MAPPINGTABLE(){
	this.name="MAPPINGTABLE";attr={};this.children=[];
};
// 4.3.1. 문서 내 그림 / OLE 정보
root.node.BINDATALIST=function Node_BINDATALIST(){
	this.name="BINDATALIST";attr={};this.children=[];
	attr.Count="0";
};
root.node.BINITEM=function Node_BINITEM(){
	this.name="BINITEM";attr={};this.children=[];
	attr.Type=null;
	attr.APath=null;
	attr.RPath=null;
	attr.BinData=null;
	attr.Format=null;
};
// 4.3.2. 글꼴 정보
root.node.FACENAMELIST=function Node_FACENAMELIST(){
	this.name="FACENAMELIST";attr={};this.children=[];
};
root.node.FONTFACE=function Node_FONTFACE(){
	this.name="FONTFACE";attr={};this.children=[];
	attr.Lang=null;
	attr.Count=null;
};
root.node.FONT=function Node_FONT(){
	this.name="FONT";attr={};this.children=[];
	attr.Id=null;
	attr.Type=null;
	attr.Name=null;
};
root.node.SUBSTFONT=function Node_SUBSTFONT(){
	this.name="SUBSTFONT";attr={};this.children=[];
	attr.Type=null;
	attr.Name=null;
};
root.node.TYPEINFO=function Node_TYPEINFO(){
	this.name="TYPEINFO";attr={};this.children=[];
	attr.FamilyType=null;
	attr.SerifStyle=null;
	attr.Weight=null;
	attr.Proportion=null;
	attr.Contrast=null;
	attr.StrokeVariation=null;
	attr.ArmStyle=null;
	attr.Letterform=null;
	attr.Midline=null;
	attr.XHeight=null;
};
// 4.3.3. 테두리 / 배경 / 채우기 정보
root.node.BORDERFILLLIST=function Node_BORDERFILLLIST(){
	this.name="BORDERFILLLIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.BORDERFILL=function Node_BORDERFILL(){
	this.name="BORDERFILL";attr={};this.children=[];
	attr.Id=null;
	attr.ThreeD="false";
	attr.Shadow="false";
	attr.Slash="0";
	attr.BackSlash="0";
	attr.CrookedSlash="0";
	attr.CounterSlash="0";
	attr.CounterBackSlash="0";
	attr.BreakCellSeparateLine="0";
	// 문서에 없음
	attr.CenterLine="0";
};
root.node.LEFTBORDER=function Node_LEFTBORDER(){
	this.name="LEFTBORDER";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color="0";
};
root.node.RIGHTBORDER=function Node_RIGHTBORDER(){
	this.name="RIGHTBORDER";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color="0";
};
root.node.TOPBORDER=function Node_TOPBORDER(){
	this.name="TOPBORDER";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color="0";
};
root.node.BOTTOMBORDER=function Node_BOTTOMBORDER(){
	this.name="BOTTOMBORDER";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color="0";
};
root.node.DIAGONAL=function Node_DIAGONAL(){
	this.name="DIAGONAL";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color="0";
};
root.node.FILLBRUSH=function Node_FILLBRUSH(){
	this.name="FILLBRUSH";attr={};this.children=[];
};
root.node.WINDOWBRUSH=function Node_WINDOWBRUSH(){
	this.name="WINDOWBRUSH";attr={};this.children=[];
	attr.FaceColor=null;
	attr.HatchColor=null;
	attr.HatchStyle=null;
	attr.Alpha=null;
};
root.node.GRADATION=function Node_GRADATION(){
	this.name="GRADATION";attr={};this.children=[];
	attr.Type=null;
	attr.Angle="90";
	attr.CenterX="0";
	attr.CenterY="0";
	attr.Step="50";
	attr.ColorNum="2";
	attr.StepCenter="50";
	attr.Alpha=null;
};
root.node.COLOR=function Node_COLOR(){
	this.name="COLOR";attr={};this.children=[];
	attr.Value=null;
};
root.node.IMAGEBRUSH=function Node_IMAGEBRUSH(){
	this.name="IMAGEBRUSH";attr={};this.children=[];
	attr.Mode="Tile";
};
root.node.IMAGE=function Node_IMAGE(){
	this.name="IMAGE";attr={};this.children=[];
	attr.Bright="0";
	attr.Contrast="0";
	attr.Effect=null;
	attr.BinItem=null;
	attr.Alpha=null;
};
// 4.3.4. 글자 모양 정보
root.node.CHARSHAPELIST=function Node_CHARSHAPELIST(){
	this.name="CHARSHAPELIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.CHARSHAPE=function Node_CHARSHAPE(){
	this.name="CHARSHAPE";attr={};this.children=[];
	attr.Id=null;
	attr.Height="1000";
	attr.TextColor="0";
	attr.ShadeColor="4294967295";
	attr.UseFontSpace="false";
	attr.UseKerning="false";
	attr.SymMark="0";
	attr.BorderFillId=null;
};
root.node.FONTID=function Node_FONTID(){
	this.name="FONTID";attr={};this.children=[];
	attr.Hangul=null;
	attr.Latin=null;
	attr.Hanja=null;
	attr.Japanese=null;
	attr.Other=null;
	attr.Symbol=null;
	attr.User=null;
};
root.node.RATIO=function Node_RATIO(){
	this.name="RATIO";attr={};this.children=[];
	attr.Hangul="100";
	attr.Latin="100";
	attr.Hanja="100";
	attr.Japanese="100";
	attr.Other="100";
	attr.Symbol="100";
	attr.User="100";
};
root.node.CHARSPACING=function Node_CHARSPACING(){
	this.name="CHARSPACING";attr={};this.children=[];
	attr.Hangul="0";
	attr.Latin="0";
	attr.Hanja="0";
	attr.Japanese="0";
	attr.Other="0";
	attr.Symbol="0";
	attr.User="0";
};
root.node.RELSIZE=function Node_RELSIZE(){
	this.name="RELSIZE";attr={};this.children=[];
	attr.Hangul="100";
	attr.Latin="100";
	attr.Hanja="100";
	attr.Japanese="100";
	attr.Other="100";
	attr.Symbol="100";
	attr.User="100";
};
root.node.CHAROFFSET=function Node_CHAROFFSET(){
	this.name="CHAROFFSET";attr={};this.children=[];
	attr.Hangul="0";
	attr.Latin="0";
	attr.Hanja="0";
	attr.Japanese="0";
	attr.Other="0";
	attr.Symbol="0";
	attr.User="0";
};
root.node.ITALIC=function Node_ITALIC(){
	this.name="ITALIC";attr={};this.children=[];
};
root.node.BOLD=function Node_BOLD(){
	this.name="BOLD";attr={};this.children=[];
};
root.node.UNDERLINE=function Node_UNDERLINE(){
	this.name="UNDERLINE";attr={};this.children=[];
	attr.Type="Bottom";
	attr.Shape="Solid";
	attr.Color="0";
};
root.node.STRIKEOUT=function Node_STRIKEOUT(){
	this.name="STRIKEOUT";attr={};this.children=[];
	attr.Type="Continuous";
	attr.Shape="Solid";
	attr.Color="0";
};
root.node.OUTLINE=function Node_OUTLINE(){
	this.name="OUTLINE";attr={};this.children=[];
	attr.Type="Solid";
};
root.node.SHADOW=function Node_SHADOW(){
	this.name="SHADOW";attr={};this.children=[];
	attr.Type=null;
	attr.Color=null;
	attr.OffsetX="10";
	attr.OffsetY="10";
	attr.Alpha=null;
};
root.node.EMBOSS=function Node_EMBOSS(){
	this.name="EMBOSS";attr={};this.children=[];
};
root.node.ENGRAVE=function Node_ENGRAVE(){
	this.name="ENGRAVE";attr={};this.children=[];
};
root.node.SUPERSCRIPT=function Node_SUPERSCRIPT(){
	this.name="SUPERSCRIPT";attr={};this.children=[];
};
root.node.SUBSCRIPT=function Node_SUBSCRIPT(){
	this.name="SUBSCRIPT";attr={};this.children=[];
};
// 4.3.5. 탭 정보
root.node.TABDEFLIST=function Node_TABDEFLIST(){
	this.name="TABDEFLIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.TABDEF=function Node_TABDEF(){
	this.name="TABDEF";attr={};this.children=[];
	attr.Id=null;
	attr.AutoTabLeft="false";
	attr.AutoTabRight="false";
};
root.node.TABITEM=function Node_TABITEM(){
	this.name="TABITEM";attr={};this.children=[];
	attr.Pos=null;
	attr.Type="Left";
	attr.Leader="Solid";
};
root.node.NUMBERINGLIST=function Node_NUMBERINGLIST(){
	this.name="NUMBERINGLIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.NUMBERING=function Node_NUMBERING(){
	this.name="NUMBERING";attr={};this.children=[];
	attr.Id=null;
	attr.Start="1";
};
root.node.PARAHEAD=function Node_PARAHEAD(){
	this.name="PARAHEAD";attr={};this.children=[];
	attr.Level=null;
	attr.Alignment="Left";
	attr.UseInstWidth="true";
	attr.AutoIndent="true";
	attr.WidthAdjust="0";
	attr.TextOffsetType="percent";
	attr.TextOffset="50";
	attr.NumFormat="Digit";
	attr.CharShape=null;
};
// 4.3.6. 글머리표 정보
root.node.BULLETLIST=function Node_BULLETLIST(){
	this.name="BULLETLIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.BULLET=function Node_BULLET(){
	this.name="BULLET";attr={};this.children=[];
	attr.Id=null;
	attr.Char=null;
	attr.Image="false";
};
// 4.3.7. 문단 모양 정보
root.node.PARASHAPELIST=function Node_PARASHAPELIST(){
	this.name="PARASHAPELIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.PARASHAPE=function Node_PARASHAPE(){
	this.name="PARASHAPE";attr={};this.children=[];
	attr.Id=null;
	attr.Align="Justify";
	attr.VerAlign="Baseline";
	attr.HeadingType="None";
	attr.Heading=null;
	attr.Level="0";
	attr.TabDef=null;
	attr.BreakLatinWord="KeepWord";
	attr.BreakNonLatinWord="true";
	attr.Condense="0";
	attr.WidowOrphan="false";
	attr.KeepWithNext="false";
	attr.KeepLines="false";
	attr.PageBreakBefore="false";
	attr.FontLineHeight="false";
	attr.SnapToGrid="true";
	attr.LineWrap="break";
	attr.AutoSpaceEAsianEng="true";
	attr.AutoSpaceEAsianNum="true";
};
root.node.PARAMARGIN=function Node_PARAMARGIN(){
	this.name="PARAMARGIN";attr={};this.children=[];
	// 숫자 또는 숫자 다음 ch
	attr.Indent="0";
	attr.Left="0";
	attr.Right="0";
	attr.Prev="0";
	attr.Next="0";
	attr.LineSpacingType="Percent";
	attr.LineSpacing="160";
};
root.node.PARABORDER=function Node_PARABORDER(){
	this.name="PARABORDER";attr={};this.children=[];
	attr.BorderFill=null;
	attr.OffsetLeft=null;
	attr.OffsetRight=null;
	attr.OffsetTop=null;
	attr.OffsetBottom=null;
	attr.Connect="false";
	attr.IgnoreMargin="false";
};
// 4.3.8. 스타일 정보
root.node.STYLELIST=function Node_STYLELIST(){
	this.name="STYLELIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.STYLE=function Node_STYLE(){
	this.name="STYLE";attr={};this.children=[];
	attr.Id=null;
	attr.Type="Para";
	attr.Name=null;
	attr.EngName=null;
	attr.ParaShape=null;
	attr.CharShape=null;
	attr.NextStyle=null;
	// TODO: 아래 두 개 타입 찾기
	attr.LangId=null;
	attr.LockForm=null;
};
// 4.3.9. 메모 정보
root.node.MEMOSHAPELIST=function Node_MEMOSHAPELIST(){
	this.name="MEMOSHAPELIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.MEMO=function Node_MEMO(){
	this.name="MEMO";attr={};this.children=[];
	attr.Id=null;
	attr.Width="0";
	// TODO: enum 찾기
	attr.LineType=null;
	attr.LineColor=null;
	attr.FillColor=null;
	attr.ActiveColor=null;
	// TODO: 타입 찾기
	attr.MemoType=null;
};
// 5. 본문 엘리먼트
root.node.BODY=function Node_BODY(){
	this.name="BODY";attr={};this.children=[];
};
root.node.SECTION=function Node_SECTION(){
	this.name="SECTION";attr={};this.children=[];
	attr.Id=null;
};
root.node.P=function Node_P(){
	this.name="P";attr={};this.children=[];
	attr.ParaShape=null;
	attr.Style=null;
	attr.InstId=null;
	attr.PageBreak="false";
	attr.ColumnBreak="false";
};
root.node.TEXT=function Node_TEXT(){
	this.name="TEXT";attr={};this.children=[];
	attr.CharShape=null;
};
// 5.1. 글자 엘리먼트
root.node.CHAR=function Node_CHAR(){
	this.name="CHAR";attr={};this.children=[];
	attr.Style=null;
};
root.node.MARKPENBEGIN=function Node_MARKPENBEGIN(){
	this.name="MARKPENBEGIN";attr={};this.children=[];
	attr.Color=null;
};
root.node.MARKPENEND=function Node_MARKPENEND(){
	this.name="MARKPENEND";attr={};this.children=[];
};
root.node.TITLEMARK=function Node_TITLEMARK(){
	this.name="TITLEMARK";attr={};this.children=[];
	attr.Ignore=null;
};
root.node.TAB=function Node_TAB(){
	this.name="TAB";attr={};this.children=[];
};
root.node.LINEBREAK=function Node_LINEBREAK(){
	this.name="LINEBREAK";attr={};this.children=[];
};
// (SIC)
root.node.HYPEN=function Node_HYPEN(){
	this.name="HYPEN";attr={};this.children=[];
};
root.node.NBSPACE=function Node_NBSPACE(){
	this.name="NBSPACE";attr={};this.children=[];
};
root.node.FWSPACE=function Node_FWSPACE(){
	this.name="FWSPACE";attr={};this.children=[];
};
// 5.2. 구역 정의 엘리먼트
root.node.SECDEF=function Node_SECDEF(){
	this.name="SECDEF";attr={};this.children=[];
	attr.TextDirection="0";
	attr.SpaceColumns=null;
	// TODO: 글자 수일때에는?
	attr.TabStop="8000";
	attr.OutlineShape="1";
	attr.LineGrid="0";
	attr.CharGrid="0";
	attr.FirstBorder="false";
	attr.FirstFill="false";
	attr.ExtMasterpageCount="0";
	attr.MemoShapeId=null;
	// 우선 존재하는 값은 0임.
	attr.TextVerticalWidthHead=null;
};
root.node.PARAMETERSET=function Node_PARAMETERSET(){
	this.name="PARAMETERSET";attr={};this.children=[];
	attr.SetId=null;
	attr.Count=null;
};
root.node.PARAMETERARRAY=function Node_PARAMETERARRAY(){
	this.name="PARAMETERARRAY";attr={};this.children=[];
	attr.Count=null;
};
root.node.ITEM=function Node_ITEM(){
	this.name="ITEM";attr={};this.children=[];
	attr.ItemId=null;
	attr.Type=null;
};
// 5.2.1. 시작 번호 정보
root.node.STARTNUMBER=function Node_STARTNUMBER(){
	this.name="STARTNUMBER";attr={};this.children=[];
	attr.PageStartsOn="Both";
	attr.Page="0";
	attr.Figure="0";
	attr.Table="0";
	attr.Equation="0";
};
// 5.2.2. 감추기 정보
root.node.HIDE=function Node_HIDE(){
	this.name="HIDE";attr={};this.children=[];
	attr.Header="false";
	attr.Footer="false";
	attr.MasterPage="false";
	attr.Border="false";
	attr.Fill="false";
	attr.PageNumPos="false";
	attr.EmptyLine="false";
};
// 5.2.3. 용지 설정 정보
root.node.PAGEDEF=function Node_PAGEDEF(){
	this.name="PAGEDEF";attr={};this.children=[];
	attr.Landscape="0";
	attr.Width="59528";
	attr.Height="84188";
	attr.GutterType="LeftOnly";
};
root.node.PAGEMARGIN=function Node_PAGEMARGIN(){
	this.name="PAGEMARGIN";attr={};this.children=[];
	attr.Left="8504";
	attr.Right="8504";
	attr.Top="5668";
	attr.Bottom="4252";
	attr.Header="4252";
	attr.Footer="4252";
	attr.Gutter="0";
};
// 5.2.4. 각주/미주 모양 정보
root.node.FOOTNOTESHAPE=function Node_FOOTNOTESHAPE(){
	this.name="FOOTNOTESHAPE";attr={};this.children=[];
};
root.node.ENDNOTESHAPE=function Node_ENDNOTESHAPE(){
	this.name="ENDNOTESHAPE";attr={};this.children=[];
};
root.node.AUTONUMFORMAT=function Node_AUTONUMFORMAT(){
	this.name="AUTONUMFORMAT";attr={};this.children=[];
	attr.Type="Digit";
	attr.UserChar=null;
	attr.PrefixChar=null;
	attr.SuffixChar=")";
	attr.Superscript=null;
};
root.node.NOTELINE=function Node_NOTELINE(){
	this.name="NOTELINE";attr={};this.children=[];
	attr.Length=null;
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color=null;
};
root.node.NOTESPACING=function Node_NOTESPACING(){
	this.name="NOTESPACING";attr={};this.children=[];
	attr.AboveLine=null;
	attr.BelowLine=null;
	attr.BetweenNotes=null;
};
root.node.NOTENUMBERING=function Node_NOTENUMBERING(){
	this.name="NOTENUMBERING";attr={};this.children=[];
	attr.Type="Continuous";
	// Type이 OnSection일 때에만 사용
	attr.NewNumber="1";
};
root.node.NOTEPLACEMENT=function Node_NOTEPLACEMENT(){
	this.name="NOTEPLACEMENT";attr={};this.children=[];
	// 부모에 따라 enum이 달라짐
	attr.Place=null;
	attr.BeneathText=null;
};
// 5.2.5. 쪽 테두리/배경 정보
root.node.PAGEBORDERFILL=function Node_PAGEBORDERFILL(){
	this.name="PAGEBORDERFILL";attr={};this.children=[];
	attr.Type="Both";
	attr.BorderFill=null;
	attr.TextBorder="false";
	attr.HeaderInside="false";
	attr.FooterInside="false";
	attr.FillArea="Paper";
};
root.node.PAGEOFFSET=function Node_PAGEOFFSET(){
	this.name="PAGEOFFSET";attr={};this.children=[];
	attr.Left="1417";
	attr.Right="1417";
	attr.Top="1417";
	attr.Bottom="1417";
};
// 5.2.6. 바탕쪽 정보
root.node.MASTERPAGE=function Node_MASTERPAGE(){
	this.name="MASTERPAGE";attr={};this.children=[];
	attr.Type="Both";
	attr.TextWidth=null;
	attr.TextHeight=null;
	attr.HasTextRef="false";
	attr.HasNumRef="false";
};
root.node.PARALIST=function Node_PARALIST(){
	this.name="PARALIST";attr={};this.children=[];
	attr.TextDirection="0";
	attr.LineWrap="Break";
	attr.VertAlign="Top";
	attr.LinkListID=null;
	attr.LinkListIDNext=null;
};
// 5.2.7. 확장 바탕쪽 정보
root.node.EXT_MASTERPAGE=function Node_EXT_MASTERPAGE(){
	this.name="EXT_MASTERPAGE";attr={};this.children=[];
	attr.Type=null;
	// Type이 OptionalPage일 때
	attr.PageNumber=null;
	attr.PageDuplicate=null;
	attr.PageFront=null;
};
// 5.3. 단 정의 정보
root.node.COLDEF=function Node_COLDEF(){
	this.name="COLDEF";attr={};this.children=[];
	attr.Type="Newspaper";
	attr.Count="1";
	attr.Layout="Left";
	attr.SameSize="false";
	attr.SameGap="0";
};
root.node.COLUMNLINE=function Node_COLUMNLINE(){
	this.name="COLUMNLINE";attr={};this.children=[];
	attr.Type="Solid";
	attr.Width="0.12mm";
	attr.Color=null;
};
root.node.COLUMNTABLE=function Node_COLUMNTABLE(){
	this.name="COLUMNTABLE";attr={};this.children=[];
};
root.node.COLUMN=function Node_COLUMN(){
	this.name="COLUMN";attr={};this.children=[];
	attr.Width=null;
	attr.Gap=null;
};
// 5.4. 표
root.node.TABLE=function Node_TABLE(){
	this.name="TABLE";attr={};this.children=[];
	attr.PageBreak="Cell";
	attr.RepeatHeader="true";
	attr.RowCount=null;
	attr.ColCount=null;
	attr.CellSpacing="0";
	attr.BorderFill=null;
};
root.node.SHAPEOBJECT=function Node_SHAPEOBJECT(){
	this.name="SHAPEOBJECT";attr={};this.children=[];
	attr.InstId=null;
	attr.ZOrder="0";
	attr.NumberingType="None";
	attr.TextWrap=null;
	attr.TextFlow="BothSides";
	attr.Lock="false";
};
root.node.SIZE=function Node_SIZE(){
	this.name="SIZE";attr={};this.children=[];
	attr.Width=null;
	attr.Height=null;
	attr.WidthRelTo="Absolute";
	attr.HeightRelTo="Absolute";
	attr.Protect="false";
};
root.node.POSITION=function Node_POSITION(){
	this.name="POSITION";attr={};this.children=[];
	attr.TreatAsChar=null;
	attr.AffectLSpacing="false";
	attr.VertRelTo=null;
	attr.VertAlign=null;
	attr.HorzRelTo=null;
	attr.HorzAlign=null;
	attr.VertOffset=null;
	attr.HorzOffset=null;
	attr.FlowWithText="false";
	attr.AllowOverlap="false";
	// 5.7.5.2992부터 추가된 속성
	attr.HoldAnchorAndSO="false";
};
root.node.OUTSIDEMARGIN=function Node_OUTSIDEMARGIN(){
	this.name="OUTSIDEMARGIN";attr={};this.children=[];
	// Table: 283, Equation: 56, Picture: 0, Drawing: 0, OLE: ?
	attr.Left=null;
	attr.Right=null;
	attr.Top=null;
	attr.Bottom=null;
};
root.node.CAPTION=function Node_CAPTION(){
	this.name="CAPTION";attr={};this.children=[];
	attr.Side="Left";
	attr.FullSize="false";
	attr.Width=null;
	attr.Gap=null;
	attr.LastWidth=null;
};
root.node.SHAPECOMMENT=function Node_SHAPECOMMENT(){
	this.name="SHAPECOMMENT";attr={};this.children=[];
};
root.node.INSIDEMARGIN=function Node_INSIDEMARGIN(){
	this.name="INSIDEMARGIN";attr={};this.children=[];
	// Table: 141, Picture: 0
	attr.Left=null;
	attr.Right=null;
	attr.Top=null;
	attr.Bottom=null;
};
root.node.CELLZONELIST=function Node_CELLZONELIST(){
	this.name="CELLZONELIST";attr={};this.children=[];
	attr.Count=null;
};
root.node.CELLZONE=function Node_CELLZONE(){
	this.name="CELLZONE";attr={};this.children=[];
	attr.StartRowAddr=null;
	attr.StartColAddr=null;
	attr.EndRowAddr=null;
	attr.EndColAddr=null;
	attr.BorderFill=null;
};
root.node.ROW=function Node_ROW(){
	this.name="ROW";attr={};this.children=[];
};
root.node.CELL=function Node_CELL(){
	this.name="CELL";attr={};this.children=[];
	attr.Name=null;
	attr.ColAddr=null;
	attr.RowAddr=null;
	attr.ColSpan="1";
	attr.RowSpan="1";
	attr.Width=null;
	attr.Height=null;
	attr.Header="false";
	attr.HasMargin="false";
	attr.Protect="false";
	attr.Editable="false";
	attr.Dirty="false";
	attr.BorderFill=null;
};
root.node.CELLMARGIN=function Node_CELLMARGIN(){
	this.name="CELLMARGIN";attr={};this.children=[];
	attr.Left="0";
	attr.Right="0";
	attr.Top="0";
	attr.Bottom="0";
};
// 5.5. 그림
root.node.PICTURE=function Node_PICTURE(){
	this.name="PICTURE";attr={};this.children=[];
	attr.Reverse="false";
};
root.node.SHAPECOMPONENT=function Node_SHAPECOMPONENT(){
	this.name="SHAPECOMPONENT";attr={};this.children=[];
	// TODO: 타입 찾기
	attr.HRef=null;
	attr.XPos="0";
	attr.YPos="0";
	attr.GroupLevel="0";
	attr.OriWidth=null;
	attr.OriHeight=null;
	attr.CurWidth=null;
	attr.CurHeight=null;
	attr.HorzFlip="false";
	attr.VertFlip="false";
	// TODO: 정말 Int인지 확인하기
	attr.InstID=null;
};
root.node.ROTATIONINFO=function Node_ROTATIONINFO(){
	this.name="ROTATIONINFO";attr={};this.children=[];
	attr.Angle="0";
	// 기본값: 개체 가운데점
	attr.CenterX=null;
	attr.CenterY=null;
};
root.node.RENDERINGINFO=function Node_RENDERINGINFO(){
	this.name="RENDERINGINFO";attr={};this.children=[];
};
root.node.TRANSMATRIX=function Node_TRANSMATRIX(){
	this.name="TRANSMATRIX";attr={};this.children=[];
	attr.E1=null;
	attr.E2=null;
	attr.E3=null;
	attr.E4=null;
	attr.E5=null;
	attr.E6=null;
};
root.node.SCAMATRIX=function Node_SCAMATRIX(){
	this.name="SCAMATRIX";attr={};this.children=[];
	attr.E1=null;
	attr.E2=null;
	attr.E3=null;
	attr.E4=null;
	attr.E5=null;
	attr.E6=null;
};
root.node.ROTMATRIX=function Node_ROTMATRIX(){
	this.name="ROTMATRIX";attr={};this.children=[];
	attr.E1=null;
	attr.E2=null;
	attr.E3=null;
	attr.E4=null;
	attr.E5=null;
	attr.E6=null;
};
root.node.LINESHAPE=function Node_LINESHAPE(){
	this.name="LINESHAPE";attr={};this.children=[];
	attr.Color=null;
	attr.Width=null;
	attr.Style="Solid";
	attr.EndCap="Flat";
	attr.HeadStyle="Normal";
	attr.TailStyle="Normal";
	attr.HeadSize="SmallSmall";
	attr.TailSize="SmallSmall";
	attr.OutlineStyle="Normal";
	attr.Alpha=null;
};
root.node.IMAGERECT=function Node_IMAGERECT(){
	this.name="IMAGERECT";attr={};this.children=[];
	attr.X0=null;
	attr.Y0=null;
	attr.X1=null;
	attr.Y1=null;
	attr.X2=null;
	attr.Y2=null;
};
root.node.IMAGECLIP=function Node_IMAGECLIP(){
	this.name="IMAGECLIP";attr={};this.children=[];
	attr.Left=null;
	attr.Top=null;
	attr.Right=null;
	attr.Bottom=null;
};
root.node.EFFECTS=function Node_EFFECTS(){
	this.name="EFFECTS";attr={};this.children=[];
};
root.node.SHADOWEFFECT=function Node_SHADOWEFFECT(){
	this.name="SHADOWEFFECT";attr={};this.children=[];
	// TODO
};
root.node.GLOW=function Node_GLOW(){
	this.name="GLOW";attr={};this.children=[];
	attr.Alpha=null;
	attr.Radius=null;
};
root.node.SOFTEDGE=function Node_SOFTEDGE(){
	this.name="SOFTEDGE";attr={};this.children=[];
	attr.Radius=null;
};
root.node.REFLECTION=function Node_REFLECTION(){
	this.name="REFLECTION";attr={};this.children=[];
	// TODO
};
root.node.EFFECTSCOLOR=function Node_EFFECTSCOLOR(){
	this.name="EFFECTSCOLOR";attr={};this.children=[];
	// TODO
};
root.node.COLOREFFECT=function Node_COLOREFFECT(){
	this.name="COLOREFFECT";attr={};this.children=[];
	// TODO
};
// 5.6. 그리기 개체
root.node.DRAWINGOBJECT=function Node_DRAWINGOBJECT(){
	this.name="DRAWINGOBJECT";attr={};this.children=[];
};
root.node.DRAWTEXT=function Node_DRAWTEXT(){
	this.name="DRAWTEXT";attr={};this.children=[];
	attr.LastWidth=null;
	attr.Name=null;
	attr.Editable="false";
};
root.node.TEXTMARGIN=function Node_TEXTMARGIN(){
	this.name="TEXTMARGIN";attr={};this.children=[];
	attr.Left="238";
	attr.Right="238";
	attr.Top="238";
	attr.Bottom="238";
};
// 5.6.1. 선
root.node.LINE=function Node_LINE(){
	this.name="LINE";attr={};this.children=[];
	attr.StartX=null;
	attr.StartY=null;
	attr.EndX=null;
	attr.EndY=null;
	attr.IsReverseHV="false";
};
// 5.6.2. 사각형
root.node.RECTANGLE=function Node_RECTANGLE(){
	this.name="RECTANGLE";attr={};this.children=[];
	attr.Ratio=null;
	attr.X0=null;
	attr.Y0=null;
	attr.X1=null;
	attr.Y1=null;
	attr.X2=null;
	attr.Y2=null;
	// DOC: X3, Y3도 있음
	attr.X3=null;
	attr.Y3=null;
};
// 5.6.3. 타원
root.node.ELLIPSE=function Node_ELLIPSE(){
	this.name="ELLIPSE";attr={};this.children=[];
	attr.IntervalDirty="false";
	attr.HasArcProperty="false";
	attr.ArcType="Normal";
	attr.CenterX=null;
	attr.CenterY=null;
	attr.Axis1X=null;
	attr.Axis1Y=null;
	attr.Axis2X=null;
	attr.Axis2Y=null;
	attr.Start1X=null;
	attr.Start1Y=null;
	attr.End1X=null;
	attr.End1Y=null;
	attr.Start2X=null;
	attr.Start2Y=null;
	attr.End2X=null;
	attr.End2Y=null;
};
// 5.6.4. 호
root.node.ARC=function Node_ARC(){
	this.name="ARC";attr={};this.children=[];
	// 위 타원과 같은 enum?
	attr.Type="Normal";
	attr.CenterX=null;
	attr.CenterY=null;
	attr.Axis1X=null;
	attr.Axis1Y=null;
	attr.Axis2X=null;
	attr.Axis2Y=null;
};
// 5.6.5. 다각형
root.node.POLYGON=function Node_POLYGON(){
	this.name="POLYGON";attr={};this.children=[];
};
root.node.POINT=function Node_POINT(){
	this.name="POINT";attr={};this.children=[];
	attr.X=null;
	attr.Y=null;
};
// 5.6.6. 곡선
root.node.CURVE=function Node_CURVE(){
	this.name="CURVE";attr={};this.children=[];
};
root.node.SEGMENT=function Node_SEGMENT(){
	this.name="SEGMENT";attr={};this.children=[];
	attr.Type="Curve";
	attr.X1=null;
	attr.Y1=null;
	attr.X2=null;
	attr.Y2=null;
};
// 5.6.7. 연결선
root.node.CONNECTLINE=function Node_CONNECTLINE(){
	this.name="CONNECTLINE";attr={};this.children=[];
	attr.Type=null;
	attr.StartX=null;
	attr.StartY=null;
	attr.EndX=null;
	attr.EndY=null;
	attr.StartSubjectID=null;
	attr.StartSubjectIndex=null;
	attr.EndSubjectID=null;
	attr.EndSubjectIndex=null;
};
// DOC: 문서에 없음
root.node.CONTROLPOINT=function Node_CONTROLPOINT(){
	this.name="CONTROLPOINT";attr={};this.children=[];
	attr.Type=null;
	attr.X=null;
	attr.Y=null;
};
// 5.7. Unknown Object
root.node.UNKNOWNOBJECT=function Node_UNKNOWNOBJECT(){
	this.name="UNKNOWNOBJECT";attr={};this.children=[];
	attr.Ctrlid=null;
	// TODO_SOMETIME: CtrlId인지 확인하기
	attr.X0=null;
	attr.Y0=null;
	attr.X1=null;
	attr.Y1=null;
	attr.X2=null;
	attr.Y2=null;
	attr.X3=null;
	attr.Y3=null;
};
// 5.8. 양식 객체
root.node.FORMOBJECT=function Node_FORMOBJECT(){
	this.name="FORMOBJECT";attr={};this.children=[];
	attr.Name=null;
	attr.ForeColor=null;
	attr.BackColor=null;
	attr.GroupName=null;
	attr.TabStop="true";
	// TODO: 타입 찾기
	attr.TabOrder=null;
	attr.Enabled="true";
	attr.BorderType="0";
	attr.DrawFrame="true";
	attr.Printable="true";
};
root.node.FORMCHARSHAPE=function Node_FORMCHARSHAPE(){
	this.name="FORMCHARSHAPE";attr={};this.children=[];
	attr.CharShape="0";
	attr.FollowContext="false";
	attr.AutoSize="false";
	attr.WordWrap="false";
};
root.node.BUTTONSET=function Node_BUTTONSET(){
	this.name="BUTTONSET";attr={};this.children=[];
	// TODO: 타입 다 찾기
	attr.Caption=null;
	attr.Value=null;
	attr.RadioGroupName=null;
	attr.TriState=null;
	attr.BackStyle=null;
};
// 5.8.1. 라디오 버튼
root.node.RADIOBUTTON=function Node_RADIOBUTTON(){
	this.name="RADIOBUTTON";attr={};this.children=[];
};
// 5.8.2. 체크 버튼
root.node.CHECKBUTTON=function Node_CHECKBUTTON(){
	this.name="CHECKBUTTON";attr={};this.children=[];
};
// 5.8.3. 콤보 박스
root.node.COMBOBOX=function Node_COMBOBOX(){
	this.name="COMBOBOX";attr={};this.children=[];
	attr.ListBoxRows=null;
	attr.ListBoxWidth=null;
	attr.Text=null;
	// TODO: 정말 Boolean인지 확인하기
	attr.EditEnable=null;
};
// 5.8.4. 에디트
root.node.EDIT=function Node_EDIT(){
	this.name="EDIT";attr={};this.children=[];
	// TODO: 타입 다 찾기
	attr.MultiLine=null;
	attr.PasswordChar=null;
	attr.MaxLength=null;
	attr.ScrollBars=null;
	attr.TabKeyBehavior=null;
	// 아래 두 개는 Boolean 확실함.
	attr.Number=null;
	attr.ReadOnly=null;
	attr.AlignText=null;
};
root.node.EDITTEXT=function Node_EDITTEXT(){
	this.name="EDITTEXT";attr={};this.children=[];
};
// 5.8.5. 리스트 박스
root.node.LISTBOX=function Node_LISTBOX(){
	this.name="LISTBOX";attr={};this.children=[];
	// TODO
};
// 5.8.6. 스크롤바
root.node.SCROLLBAR=function Node_SCROLLBAR(){
	this.name="SCROLLBAR";attr={};this.children=[];
	// TODO
};
// 5.9. 묶음 객체
root.node.CONTAINER=function Node_CONTAINER(){
	this.name="CONTAINER";attr={};this.children=[];
};
// 5.10. OLE 객체
root.node.OLE=function Node_OLE(){
	this.name="OLE";attr={};this.children=[];
	// 오타 아님!
	attr.ObjetType=null;
	attr.ExtentX=null;
	attr.ExtentY=null;
	attr.BinItem=null;
	attr.DrawAspect=null;
	attr.HasMoniker="false";
	attr.EqBaseLine=null;
};
// 5.11. 한글 97 수식
root.node.EQUATION=function Node_EQUATION(){
	this.name="EQUATION";attr={};this.children=[];
	attr.LineMode="false";
	attr.BaseUnit="1000";
	attr.TextColor="0";
	attr.BaseLine=null;
	attr.Version=null;
};
root.node.SCRIPT=function Node_SCRIPT(){
	this.name="SCRIPT";attr={};this.children=[];
};
// 5.12. 글맵시
root.node.TEXTART=function Node_TEXTART(){
	this.name="TEXTART";attr={};this.children=[];
	attr.Text=null;
	attr.X0=null;
	attr.Y0=null;
	attr.X1=null;
	attr.Y1=null;
	attr.X2=null;
	attr.Y2=null;
	attr.X3=null;
	attr.Y3=null;
};
root.node.TEXTARTSHAPE=function Node_TEXTARTSHAPE(){
	this.name="TEXTARTSHAPE";attr={};this.children=[];
	attr.FontName=null;
	// TODO_SOMETIME: enum 찾기
	attr.FontStyle="Regular";
	// TODO: enum 정하기 (htf?)
	attr.FontType="ttf";
	attr.TextShape="0";
	attr.LineSpacing="120";
	attr.CharSpacing="100";
	attr.Align="Left";
};
root.node.OUTLINEDATA=function Node_OUTLINEDATA(){
	this.name="OUTLINEDATA";attr={};this.children=[];
	attr.Count=null;
};
// 5.13. 필드 시작
root.node.FILEDBEGIN=function Node_FILEDBEGIN(){
	this.name="FILEDBEGIN";attr={};this.children=[];
	attr.Type=null;
	attr.Name=null;
	attr.InstId=null;
	attr.Editable="true";
	attr.Dirty="false";
	// TODO_SOMETIME: 타입 찾기
	attr.Property=null;
	attr.Command=null;
};
// 5.14. 필드 끝
root.node.FIELDEND=function Node_FIELDEND(){
	this.name="FIELDEND";attr={};this.children=[];
	attr.Type=null;
	attr.Editable="true";
	// TODO_SOMETIME: 타입 찾기
	attr.Property=null;
};
// 5.15. 책갈피
root.node.BOOKMARK=function Node_BOOKMARK(){
	this.name="BOOKMARK";attr={};this.children=[];
	attr.Name=null;
};
// 5.16. 머리말, 꼬리말
root.node.HEADER=function Node_HEADER(){
	this.name="HEADER";attr={};this.children=[];
	// TODO
};
root.node.FOOTER=function Node_FOOTER(){
	this.name="FOOTER";attr={};this.children=[];
	// TODO
};
// 5.17. 각주, 미주
root.node.FOOTNOTE=function Node_FOOTNOTE(){
	this.name="FOOTNOTE";attr={};this.children=[];
};
root.node.ENDNOTE=function Node_ENDNOTE(){
	this.name="ENDNOTE";attr={};this.children=[];
};
// 5.18. 자동 번호, 새 번호
root.node.AUTONUM=function Node_AUTONUM(){
	this.name="AUTONUM";attr={};this.children=[];
	// TODO
};
root.node.NEWNUM=function Node_NEWNUM(){
	this.name="NEWNUM";attr={};this.children=[];
	// TODO
};
// 5.19. 홀/짝수 조정
root.node.PAGENUMCTRL=function Node_PAGENUMCTRL(){
	this.name="PAGENUMCTRL";attr={};this.children=[];
	attr.PageStartsOn="Both";
};
// 5.20. 감추기
root.node.PAGEHIDING=function Node_PAGEHIDING(){
	this.name="PAGEHIDING";attr={};this.children=[];
	attr.HideHeader="false";
	attr.HideFooter="false";
	attr.HideMasterPage="false";
	attr.HideBorder="false";
	attr.HideFill="false";
	attr.HidePageNum="false";
};
// 5.21. 쪽번호 위치
root.node.PAGENUM=function Node_PAGENUM(){
	this.name="PAGENUM";attr={};this.children=[];
	attr.Pos="TopLeft";
	attr.FormatType="Digit";
	// TODO: 타입 찾기
	attr.SideChar=null;
};
// 5.22. 찾아보기 표식
root.node.INDEXMARK=function Node_INDEXMARK(){
	this.name="INDEXMARK";attr={};this.children=[];
};
root.node.KEYFIRST=function Node_KEYFIRST(){
	this.name="KEYFIRST";attr={};this.children=[];
};
root.node.KEYSECOND=function Node_KEYSECOND(){
	this.name="KEYSECOND";attr={};this.children=[];
};
// 5.23. 글자 겹침
root.node.COMPOSE=function Node_COMPOSE(){
	this.name="COMPOSE";attr={};this.children=[];
	// TODO
};
root.node.COMPCHARSHAPE=function Node_COMPCHARSHAPE(){
	this.name="COMPCHARSHAPE";attr={};this.children=[];
	attr.ShapeID=null;
};
// 5.24. 덧말
root.node.DUTMAL=function Node_DUTMAL(){
	this.name="DUTMAL";attr={};this.children=[];
	// TODO
};
root.node.MAINTEXT=function Node_MAINTEXT(){
	this.name="MAINTEXT";attr={};this.children=[];
};
root.node.SUBTEXT=function Node_SUBTEXT(){
	this.name="SUBTEXT";attr={};this.children=[];
};
// 5.25. 숨은 설명
root.node.HIDDENCOMMENT=function Node_HIDDENCOMMENT(){
	this.name="HIDDENCOMMENT";attr={};this.children=[];
};
// 6. 부가 정보 엘리먼트
root.node.TAIL=function Node_TAIL(){
	this.name="TAIL";attr={};this.children=[];
};
root.node.BINDATASTORAGE=function Node_BINDATASTORAGE(){
	this.name="BINDATASTORAGE";attr={};this.children=[];
};
root.node.BINDATA=function Node_BINDATA(){
	this.name="BINDATA";attr={};this.children=[];
	attr.Id=null;
	attr.Size=null;
	attr.Encoding="Base64";
	attr.Compress="true";
};
root.node.SCRIPTCODE=function Node_SCRIPTCODE(){
	this.name="SCRIPTCODE";attr={};this.children=[];
	attr.Type="JScript";
	attr.Version=null;
};
root.node.SCRIPTHEADER=function Node_SCRIPTHEADER(){
	this.name="SCRIPTHEADER";attr={};this.children=[];
};
root.node.SCRIPTSOURCE=function Node_SCRIPTSOURCE(){
	this.name="SCRIPTSOURCE";attr={};this.children=[];
};
root.node.PRESCRIPT=function Node_PRESCRIPT(){
	this.name="PRESCRIPT";attr={};this.children=[];
	attr.Count=null;
};
root.node.POSTSCRIPT=function Node_POSTSCRIPT(){
	this.name="POSTSCRIPT";attr={};this.children=[];
	attr.Count=null;
};
root.node.SCRIPTFUNCTION=function Node_SCRIPTFUNCTION(){
	this.name="SCRIPTFUNCTION";attr={};this.children=[];
};
root.node.XMLTEMPLATE=function Node_XMLTEMPLATE(){
	this.name="XMLTEMPLATE";attr={};this.children=[];
};
root.node.SCHEMA=function Node_SCHEMA(){
	this.name="SCHEMA";attr={};this.children=[];
};
root.node.INSTANCE=function Node_INSTANCE(){
	this.name="INSTANCE";attr={};this.children=[];
};
root.node.COMPATIBLEDOCUMENT=function Node_COMPATIBLEDOCUMENT(){
	this.name="COMPATIBLEDOCUMENT";attr={};this.children=[];
	attr.TargetProgram="None";
};
root.node.LAYOUTCOMPATIBILITY=function Node_LAYOUTCOMPATIBILITY(){
	this.name="LAYOUTCOMPATIBILITY";attr={};this.children=[];
	attr.ApplyFontWeightToBold="false";
	attr.UseInnerUnderline="false";
	attr.FixedUnderlineWidth="false";
	attr.DoNotApplyStrikeout="false";
	attr.UseLowercaseStrikeout="false";
	attr.ExtendLineheightToOffset="false";
	attr.TreatQuotationAsLatin="false";
	attr.DoNotAlignWhitespaceOnRight="false";
	attr.DoNotAdjustWordInJustify="false";
	attr.BaseCharUnitOnEAsian="false";
	attr.BaseCharUnitOfIndentOnFirstChar="false";
	attr.AdjustLineheightToFont="false";
	attr.AdjustBaselineInFixedLinespacing="false";
	attr.ExcludeOverlappingParaSpacing="false";
	attr.ApplyNextspacingOfLastPara="false";
	attr.ApplyAtLeastToPercent100Pct="false";
	attr.DoNotApplyAutoSpaceEAsianEng="false";
	attr.DoNotApplyAutoSpaceEAsianNum="false";
	attr.AdjustParaBorderfillToSpacing="false";
	attr.ConnectParaBorderfillOfEqualBorder="false";
	attr.AdjustParaBorderOffsetWithBorder="false";
	attr.ExtendLineheightToParaBorderOffset="false";
	attr.ApplyParaBorderToOutside="false";
	attr.BaseLinespacingOnLinegrid="false";
	attr.ApplyCharSpacingToCharGrid="false";
	attr.DoNotApplyGridInHeaderfooter="false";
	attr.ExtendHeaderfooterToBody="false";
	attr.AdjustEndnotePositionToFootnote="false";
	attr.DoNotApplyImageEffect="false";
	attr.DoNotApplyShapeComment="false";
	attr.DoNotAdjustEmptyAnchorLine="false";
	attr.OverlapBothAllowOverlap="false";
	attr.DoNotApplyVertOffsetOfForward="false";
	attr.ExtendVertLimitToPageMargins="false";
	attr.DoNotHoldAnchorOfTable="false";
	attr.DoNotFormattingAtBeneathAnchor="false";
	attr.DoNotApplyExtensionCharCompose="false";
};
*/