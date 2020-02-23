/**
*
*  This code is generated from /format/hwp-node-record.js and
*  /format/*.format via /generate.js with jison.
*
**/

var bufferToString = function(buffer: Buffer){
	let s = '';
	for(let i = 0, ii = buffer.length; i < ii; i++){
		let t = buffer[i].toString(16).toUpperCase();
		if(t.length < 2) t = '0' + t;
		s += (i ? ' ' + t : t);
	}
	return s;
};

const root = {record:{}, node:{}, tag:{}, enum:{} as any};

const enumArg = {
	LineType1: ["None","Solid","Dash","Dot","DashDot","DashDotDot","LongDash","Circle","DoubleSlim","SlimThick","ThickSlim","SlimThickSlim"],
	LineType2: ["Solid","Dash","Dot","DashDot","DashDotDot","LongDash","Circle","DoubleSlim","SlimThick","ThickSlim","SlimThickSlim"],
	LineType3: [null,"Solid","Dot","Thick","Dash","DashDot","DashDotDot"],
	LineWidth: ["0.1mm","0.12mm","0.15mm","0.2mm","0.25mm","0.3mm","0.4mm","0.5mm","0.6mm","0.7mm","1.0mm","1.5mm","2.0mm","3.0mm","4.0mm","5.0mm"],
	NumberType1: ["Digit","CircledDigit","RomanCapital","RomanSmall","LatinCapital","LatinSmall","CircledLatinCapital","CircledLatinSmall","HangulSyllable","CircledHangulSyllable","HangulJamo","CircledHangulJamo","HangulPhonetic","Ideograph","CircledIdeograph"],
	NumberType2: ["Digit","CircledDigit","RomanCapital","RomanSmall","LatinCapital","LatinSmall","CircledLatinCapital","CircledLatinSmall","HangulSyllable","CircledHangulSyllable","HangulJamo","CircledHangulJamo","HangulPhonetic","Ideograph","CircledIdeograph","DecagonCircle","DecagonCircleHanja",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"Symbol","UserChar"],
	AlignmentType1: ["Justify","Left","Right","Center","Distribute","DistributeSpace"],
	AlignmentType2: ["Left","Center","Right"],
	ArrowType: ["Normal","Arrow","Spear","ConcaveArrow","EmptyDiamond","EmptyCircle","EmptyBox","FilledDiamond","FilledCircle","FilledBox"],
	ArrowSize: ["SmallSmall","SmallMedium","SmallLarge","MediumSmall","MediumMedium","MediumLarge","LargeSmall","LargeMedium","LargeLarge"],
	LangType: ["Hangul","Latin","Hanja","Japanese","Other","Symbol","User"],
	HatchStyle: ["Horizontal","Vertical","Slash","BackSlash","Cross","CrossDiagonal"],
	InfillMode: ["Tile","TileHorzTop","TileHorzBottom","TileVertLeft","TileVertRight","Total","Center","CenterTop","CenterBottom","LeftCenter","LeftTop","LeftBottom","RightCenter","RightTop","RightBottom","Zoom"],
	LineWrapType: ["Break","Squeeze","Keep"],
// TODO: DOC: 문서와 실제가 다름. Tight와 Through 확인하기.
	TextWrapType: ["Square","TopAndBottom","BehindText","InFrontOfText","Tight","Through"],
	FieldType: ["Clickhere","Hyperlink","Bookmark","Formula","Summery","UserInfo","Date","DocDate","Path","Crossref","Mailmerge","Memo","RevisionChange","RevisionSign","RevisionDelete","RevisionAttach","RevisionClipping","RevisionSawtooth","RevisionThinking","RevisionPraise","RevisionLine","RevisionSimpleChange","RevisionHyperlink","RevisionLineAttach","RevisionLineLink","RevisionLineTransfer","RevisionRightmove","RevisionLeftmove","RevisionTransfer","RevisionSplit"],
// Implict enum
	BinItemType: ["Link","Embedding","Storage"],
	FontType: ["rep","ttf","hft"],
	GradationType: [null,"Linear","Radial","Conical","Square"],
	ShadowType: [null,"Drop","Cont"],
	ImageEffectType: ["RealPic","GrayScale","BlackWhite"],
	UnderlineType: [null,"Bottom","Center","Top"],
	StrikeoutType: ["None","Continuous"],
	TabItemType: ["Left","Right","Center","Decimal"],
	TextOffsetType: ["percent","hwpunit"],
	VerAlignType: ["Baseline","Top","Center","Bottom"],
	HeadingType: ["None","Outline","Number","Bullet"],
	BreakLatinWordType: ["KeepWord","Hyphenation","BreakWord"],
	LineSpacingType: ["Percent","Fixed","BetweenLines","AtLeast"],
	StyleType: ["Para","Char"],
	ItemType: ["Bstr","Integer","Set","Array","BinData"],
	PageStartsOnType: ["Both","Even","Odd"],
	GutterType: ["LeftOnly","LeftRight","TopBottom"],
	NoteNumberingType: ["Continuous","OnSection","OnPage"],
	FootNoteShapePlaceType: ["EachColumn","MergedColumn","RightMostColumn"],
	EndNoteShapePlaceType: ["EndOfDocument","EndOfSection"],
// PageStartsOnType과 같으나 혹시 몰라 다시 적음
	PageBorderFillType: ["Both","Even","Odd"],
	FillAreaType: ["Paper","Page","Border"],
// 역시 다시 적음
	MasterPageType: ["Both","Even","Odd"],
// VerAlignType과 다름

	ExtMasterPageType: ["LastPage","OptionalPage"],
	ColDefType: ["Newspaper","BalancedNewspaper","Parallel"],
	LayoutType: ["Left","Right","Mirror"],
	PageBreakType: ["None","Table","Cell"],
	NumberingType: ["None","Figure","Table","Equation"],
	TextFlowType: ["BothSides","LeftOnly","RightOnly","LargestOnly"],
	WidthRelToType: ["Paper","Page","Column","Para","Absolute"],
	HeightRelToType: ["Paper","Page","Absolute"],
	VertRelToType: ["Paper","Page","Para"],
	VertAlignType: ["Top","Center","Bottom","Inside","Outside"],
	HorzRelToType: ["Paper","Page","Column","Para"],
	HorzAlignType: ["Left","Center","Right","Inside","Outside"],
	SideType: ["Left","Right","Top","Bottom"],
	EndCapType: ["Round","Flat"],
	OutlineStyleType: ["Normal","Outer","Inner"],
	ArcType: ["Normal","Pie","Chord"],
	SegmentType: ["Line","Curve"],
	ObjetType: ["Unknown","Embedded","Link","Static","Equation"],
	DrawAspectType: ["Content","ThumbNail","Icon","DocPrint"],
	AlignType: ["Left","Right","Center","Full","Table"],
	PosType: ["None","TopLeft","TopCenter","TopRight","BottomLeft","BottomCenter","BottomRight","OutsideTop","OutsideBottom","InsideTop","InsideBottom"],
	TargetProgramType: ["None","Hwp70","Word"],
	get: (name: string, i: number) => {
		if(enumArg[name][i]) return enumArg[name][i];
		return i;
	},
};

root.tag.table = [];
if(typeof root === 'undefined')root={'record':{},'node':{},'tag':{},'enum':{}};
// HWP 레코드
root.tag.BEGIN = 16;
root.tag.DOCUMENT_PROPERTIES = 16;
root.tag.ID_MAPPINGS = 17;
root.tag.BIN_DATA = 18;
root.tag.FACE_NAME = 19;
root.tag.BORDER_FILL = 20;
root.tag.CHAR_SHAPE = 21;
root.tag.TAB_DEF = 22;
root.tag.NUMBERING = 23;
root.tag.BULLET = 24;
root.tag.PARA_SHAPE = 25;
root.tag.STYLE = 26;
root.tag.DOC_DATA = 27;
root.tag.DISTRIBUTE_DOC_DATA = 28;
// 13: Reserved
root.tag.COMPATIBLE_DOCUMENT = 30;
root.tag.LAYOUT_COMPATIBILITY = 31;
root.tag.FORBIDDEN_CHAR = 94;
root.tag.PARA_HEADER = 66;
root.tag.PARA_TEXT = 67;
root.tag.PARA_CHAR_SHAPE = 68;
root.tag.PARA_LINE_SEG = 69;
root.tag.PARA_RANGE_TAG = 70;
root.tag.CTRL_HEADER = 71;
root.tag.LIST_HEADER = 72;
root.tag.PAGE_DEF = 73;
root.tag.FOOTNOTE_SHAPE = 74;
root.tag.PAGE_BORDER_FILL = 75;
root.tag.SHAPE_COMPONENT = 76;
root.tag.TABLE = 77;
root.tag.SHAPE_COMPONENT_LINE = 78;
root.tag.SHAPE_COMPONENT_RECTANGLE = 79;
root.tag.SHAPE_COMPONENT_ELLIPSE = 80;
root.tag.SHAPE_COMPONENT_ARC = 81;
root.tag.SHAPE_COMPONENT_POLYGON = 82;
root.tag.SHAPE_COMPONENT_CURVE = 83;
root.tag.SHAPE_COMPONENT_OLE = 84;
root.tag.SHAPE_COMPONENT_PICTURE = 85;
root.tag.SHAPE_COMPONENT_CONTAINER = 86;
root.tag.CTRL_DATA = 87;
root.tag.EQEDIT = 88;
// 73: Reserved
root.tag.SHAPE_COMPONENT_TEXTART = 90;
root.tag.FORM_OBJECT = 91;
root.tag.MEMO_SHAPE = 92;
root.tag.MEMO_LIST = 93;
root.tag.CHART_DATA = 95;
root.tag.SHAPE_COMPONENT_UNKNOWN = 115;
// 4.1.1. 문서 속성

root.tag.table = [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"DOCUMENT_PROPERTIES","ID_MAPPINGS","BIN_DATA","FACE_NAME","BORDER_FILL","CHAR_SHAPE","TAB_DEF","NUMBERING","BULLET","PARA_SHAPE","STYLE","DOC_DATA","DISTRIBUTE_DOC_DATA",null,"COMPATIBLE_DOCUMENT","LAYOUT_COMPATIBILITY",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"PARA_HEADER","PARA_TEXT","PARA_CHAR_SHAPE","PARA_LINE_SEG","PARA_RANGE_TAG","CTRL_HEADER","LIST_HEADER","PAGE_DEF","FOOTNOTE_SHAPE","PAGE_BORDER_FILL","SHAPE_COMPONENT","TABLE","SHAPE_COMPONENT_LINE","SHAPE_COMPONENT_RECTANGLE","SHAPE_COMPONENT_ELLIPSE","SHAPE_COMPONENT_ARC","SHAPE_COMPONENT_POLYGON","SHAPE_COMPONENT_CURVE","SHAPE_COMPONENT_OLE","SHAPE_COMPONENT_PICTURE","SHAPE_COMPONENT_CONTAINER","CTRL_DATA","EQEDIT",null,"SHAPE_COMPONENT_TEXTART","FORM_OBJECT","MEMO_SHAPE","MEMO_LIST","FORBIDDEN_CHAR","CHART_DATA",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"SHAPE_COMPONENT_UNKNOWN"];

// Node
var HWPNode = function HWPNode(){
	this.children = [];
};

var escapeHTML = function(s){
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

HWPNode.prototype.value = null;
HWPNode.prototype.offset = 0;

HWPNode.prototype.getEncodedValue = function(toHML){
	if(this.value == null) return null;
	switch(this.encoding){
		case 'base64':
			return escapeHTML((new Buffer(this.value, 'utf16le')).toString('base64'));
		default:
			if(this.children.length > 0){
				var li = 0, v = "";
				this.children.forEach(function(elem){
					v += escapeHTML(this.value.slice(li, elem.offset));
					v += toHML(elem, '', '');
					li = elem.offset;
				}, this);
				return v + escapeHTML(this.value.slice(li));
			}
	}
	return escapeHTML(this.value);
};

HWPNode.prototype.toHML = function(verbose){
	var toHML = function toHML(obj, tab, nl){
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
};

HWPNode.prototype.add = function add(elem){
	this.children.push(elem);
	this.setCount();
};

var _setAttr = function(t, n, v){
	if(t.attr[n] === undefined) console.warn("Warning [%s]: unexpected attr %s", t.name, n);
	t.attr[n] = v;
};

HWPNode.prototype.setAttrWithFilter = function(attrs, filter){
	filter = filter.bind(attrs);
	for(var name in attrs){
		if(name[0] == '_' || typeof attrs[name] == 'object') continue;
		if(filter(name)) _setAttr(this, name, attrs[name]);
	}
};

HWPNode.prototype.setAttr = function setAttr(attrs, list){
	if(list) list.forEach(function(name){
		_setAttr(this, name, attrs[name]);
	}, this);
	else for(var name in attrs){
		if(name[0] == '_' || typeof attrs[name] == 'object') continue;
		_setAttr(this, name, attrs[name]);
	}
};

HWPNode.prototype.setCount = function setCount(){
	if('Count' in this.attr) this.attr.Count = this.children.length;
};

// Make one if not exists
HWPNode.prototype.getChild = function getChild(name){
	name = name.toUpperCase();
	for(var i=0;i<this.children.length;i++){
		if(this.children[i].name === name) return this.children[i];
	}
	var o = new root.node[name]();
	this.add(o); return o;
};

// Only finds one
HWPNode.prototype.go = HWPNode.prototype.findChild = function findChild(name){
	name = name.toUpperCase();
	for(var i=0;i<this.children.length;i++){
		if(this.children[i].name === name) return this.children[i];
	}
	return null;
};

// Find all children
HWPNode.prototype.findChildren = function findChildren(name){
	name = name.toUpperCase();
	return this.children.filter(function(o){return o.name === name;});
};

// Make one if not exists
HWPNode.prototype.getChildWith = function getChildWith(name, attr_name, attr_val){
	name = name.toUpperCase();
	for(var i=0;i<this.children.length;i++){
		if(this.children[i].name === name && this.children[i].attr[attr_name] === attr_val)
			return this.children[i];
	}
	var o = new root.node[name]();
	o.attr[attr_name] = attr_val;
	this.add(o); return o;
};

HWPNode.prototype.findChildWith = function findChildWith(name, attr_name, attr_val){
	name = name.toUpperCase();
	for(var i=0;i<this.children.length;i++){
		if(this.children[i].name === name && this.children[i].attr[attr_name] === attr_val)
			return this.children[i];
	}
	return null;
};

for(var name in root.node){
	root.node[name].prototype = new HWPNode();
}

// Record
var HWPRecord = function HWPRecord(){};

HWPRecord.prototype.toString = function(){
	var toStr = function toStr(obj, t){
		var s = t + obj.name + ' | ' + bufferToString(obj.data);
		if(obj.children) obj.children.forEach(function(o){
			s += '\n'+toStr(o, t+'\t');
		});
		return s;
	};
	return toStr(this, '');
};

for(name in root.record){
	root.record[name].prototype = new HWPRecord();
}

var HWPRawRecord = function HWPRawRecord(offset, buffer){
	var header = buffer.readUInt32LE(offset); offset += 4;
	this.tag = header&0x3FF;
	this.level = (header>>10)&0x3FF;
	this.size = header>>20;
	if(this.size == 4095){
		this.size = buffer.readUInt32LE(offset);
		offset += 4;
	}
	this.data = buffer.slice(offset, offset + this.size);
	this._offset = offset + this.size;
};

HWPRawRecord.prototype.resolve = function(parent){
	var tag = root.tag.table[this.tag];
	if(!tag){
		console.warn("Warning [%s]: unknown tag %d", parent && parent.name || "(ROOT)", this.tag);
		this.children = [];
		return this;
	}
	if(!root.record[tag]) throw new Error("Non-existing record type: "+tag);

	var obj;
	try{
		obj = new root.record[tag](this.data);
	}catch(e){
		console.error("Tag: %s", tag);
		console.error("Data: %s", bufferToString(this.data));
		throw e;
	}
	obj.children = [];
	return obj;
};





module.exports = root;
