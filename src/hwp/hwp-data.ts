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

const tag = {
    BEGIN: 16,
    DOCUMENT_PROPERTIES: 16,
    ID_MAPPINGS: 17,
    BIN_DATA: 18,
    FACE_NAME: 19,
    BORDER_FILL: 20,
    CHAR_SHAPE: 21,
    TAB_DEF: 22,
    NUMBERING: 23,
    BULLET: 24,
    PARA_SHAPE: 25,
    STYLE: 26,
    DOC_DATA: 27,
    DISTRIBUTE_DOC_DATA: 28,
    // 13: Reserved
    COMPATIBLE_DOCUMENT: 30,
    LAYOUT_COMPATIBILITY: 31,
    FORBIDDEN_CHAR: 94,
    PARA_HEADER: 66,
    PARA_TEXT: 67,
    PARA_CHAR_SHAPE: 68,
    PARA_LINE_SEG: 69,
    PARA_RANGE_TAG: 70,
    CTRL_HEADER: 71,
    LIST_HEADER: 72,
    PAGE_DEF: 73,
    FOOTNOTE_SHAPE: 74,
    PAGE_BORDER_FILL: 75,
    SHAPE_COMPONENT: 76,
    TABLE: 77,
    SHAPE_COMPONENT_LINE: 78,
    SHAPE_COMPONENT_RECTANGLE: 79,
    SHAPE_COMPONENT_ELLIPSE: 80,
    SHAPE_COMPONENT_ARC: 81,
    SHAPE_COMPONENT_POLYGON: 82,
    SHAPE_COMPONENT_CURVE: 83,
    SHAPE_COMPONENT_OLE: 84,
    SHAPE_COMPONENT_PICTURE: 85,
    SHAPE_COMPONENT_CONTAINER: 86,
    CTRL_DATA: 87,
    EQEDIT: 88,
    // 73: Reserved
    SHAPE_COMPONENT_TEXTART: 90,
    FORM_OBJECT: 91,
    MEMO_SHAPE: 92,
    MEMO_LIST: 93,
    CHART_DATA: 95,
    SHAPE_COMPONENT_UNKNOWN: 115,
    // 4.1.1. 문서 속성
    
    table: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"DOCUMENT_PROPERTIES","ID_MAPPINGS","BIN_DATA","FACE_NAME","BORDER_FILL","CHAR_SHAPE","TAB_DEF","NUMBERING","BULLET","PARA_SHAPE","STYLE","DOC_DATA","DISTRIBUTE_DOC_DATA",null,"COMPATIBLE_DOCUMENT","LAYOUT_COMPATIBILITY",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"PARA_HEADER","PARA_TEXT","PARA_CHAR_SHAPE","PARA_LINE_SEG","PARA_RANGE_TAG","CTRL_HEADER","LIST_HEADER","PAGE_DEF","FOOTNOTE_SHAPE","PAGE_BORDER_FILL","SHAPE_COMPONENT","TABLE","SHAPE_COMPONENT_LINE","SHAPE_COMPONENT_RECTANGLE","SHAPE_COMPONENT_ELLIPSE","SHAPE_COMPONENT_ARC","SHAPE_COMPONENT_POLYGON","SHAPE_COMPONENT_CURVE","SHAPE_COMPONENT_OLE","SHAPE_COMPONENT_PICTURE","SHAPE_COMPONENT_CONTAINER","CTRL_DATA","EQEDIT",null,"SHAPE_COMPONENT_TEXTART","FORM_OBJECT","MEMO_SHAPE","MEMO_LIST","FORBIDDEN_CHAR","CHART_DATA",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"SHAPE_COMPONENT_UNKNOWN"],
    
    }
    