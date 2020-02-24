
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


root.record.DOCUMENT_PROPERTIES = function Record_DOCUMENT_PROPERTIES(data){
	var tmp,attr=this.attr={};this.data=data;this.name="DOCUMENT_PROPERTIES";
	attr.SecCnt=this.data.readUInt16LE(0);
	attr.BeginNumber={};
	attr.BeginNumber.Page=this.data.readUInt16LE(2);
	attr.BeginNumber.Footnote=this.data.readUInt16LE(4);
	attr.BeginNumber.Endnote=this.data.readUInt16LE(6);
	attr.BeginNumber.Picture=this.data.readUInt16LE(8);
	attr.BeginNumber.Table=this.data.readUInt16LE(10);
	attr.BeginNumber.Equation=this.data.readUInt16LE(12);
	attr.CaretPos={};
	attr.CaretPos.List=this.data.readUInt32LE(14);
	attr.CaretPos.Para=this.data.readUInt32LE(18);
	attr.CaretPos.Pos=this.data.readUInt32LE(22);
};
// 4.1.2. 아이피 매핑 헤더
root.record.ID_MAPPINGS = function Record_ID_MAPPINGS(data){
	var tmp,attr=this.attr={};this.data=data;this.name="ID_MAPPINGS";
	attr.BinDataCount=this.data.readInt32LE(0);
	attr.FontCount=[];var offset={'value':4};
	for(var ii0=0;ii0<7;ii0++){
		attr.FontCount[ii0]={};
		attr.FontCount[ii0].value=this.data.readInt32LE(offset.value); offset.value+=4;
	}
	attr.BorderFillCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.CharShapeCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.TabDefCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.NumberingCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.BulletCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.ParaShapeCount=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.StyleCount=this.data.readInt32LE(offset.value); offset.value+=4;
	if(offset.value>=this.data.length)return;
	attr.MemoCount=this.data.readInt32LE(offset.value); offset.value+=4;
};
// 4.1.3. 바이너리 데이터
root.record.BIN_DATA = function Record_BIN_DATA(data){
	var tmp,attr=this.attr={};this.data=data;this.name="BIN_DATA";
	tmp=this.data.slice(0,2);
	attr.Type=(tmp[0]&0xf);if(enum.BinItemType[attr.Type]!==undefined)attr.Type=enum.BinItemType[attr.Type];
	// TODO: 이 두 개 HML로 옮길 수 있는지 확인하기
	attr._Compress=((tmp[0]&0x30)>>4);
	// TODO: DOC: 6~7 맞는지 확인하기
	attr._AccessStatus=((tmp[0]&0xc0)>>6);
	var offset={'value':2};switch(''+(attr.Type)){
	case "Embedding": case "Storage":
	attr.BinData=this.data.readUInt16LE(offset.value); offset.value+=2;
	tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.Format='';tmp-->0;){attr.Format+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	break;
	default:
	console.warn("Warning [BIN_DATA]: not processing BinItem type '%s'", attr.Type);
	}
};
// 4.1.4. 글꼴
root.record.FACE_NAME = function Record_FACE_NAME(data){
	var tmp,attr=this.attr={};this.data=data;this.name="FACE_NAME";
	tmp=this.data.slice(0,1);
	// DOC: 문서에 없음
	attr.Type=(tmp[0]&0x3);if(enum.FontType[attr.Type]!==undefined)attr.Type=enum.FontType[attr.Type];
	attr.HasDefault=!!((tmp[0]&0x20)>>5);
	attr.HasShape=!!((tmp[0]&0x40)>>6);
	attr.HasSubst=!!((tmp[0]&0x80)>>7);
	tmp=this.data.readUInt16LE(1);var offset={'value':3};for(attr.Name='';tmp-->0;){attr.Name+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	if(attr.HasSubst){
	attr.SubstFont={};
	tmp=this.data.slice(offset.value,(offset.value+1)); offset.value+=1;
	attr.SubstFont.Type=(tmp[0]&0x3);if(enum.FontType[attr.SubstFont.Type]!==undefined)attr.SubstFont.Type=enum.FontType[attr.SubstFont.Type];
	tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.SubstFont.Name='';tmp-->0;){attr.SubstFont.Name+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	}
	if(attr.HasShape){
	attr.TypeInfo={};
	attr.TypeInfo.FamilyType=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.SerifStyle=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.Weight=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.Proportion=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.Contrast=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.StrokeVariation=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.ArmStyle=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.Letterform=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.Midline=this.data.readUInt8(offset.value); offset.value+=1;
	attr.TypeInfo.XHeight=this.data.readUInt8(offset.value); offset.value+=1;
	}
	if(attr.HasDefault){
	// TODO_SOMETIME: 이 곳 채워넣기
	}
};
// 4.1.5 테두리 / 배경
root.record.BORDER_FILL = function Record_BORDER_FILL(data){
	var tmp,attr=this.attr={};this.data=data;this.name="BORDER_FILL";
	tmp=this.data.slice(0,2);
	attr.ThreeD=!!(tmp[0]&0x1);
	attr.Shadow=!!((tmp[0]&0x2)>>1);
	attr.Slash=((tmp[0]&0x1c)>>2);
	attr.BackSlash=((tmp[0]&0xe0)>>5);
	// DOC: 문서와 다르게 이렇게 저장됨.
	attr.LeftBorder={};
	attr.LeftBorder.Type=this.data.readUInt8(2);if(enum.LineType1[attr.LeftBorder.Type]!==undefined)attr.LeftBorder.Type=enum.LineType1[attr.LeftBorder.Type];
	attr.LeftBorder.Width=this.data.readUInt8(3);if(enum.LineWidth[attr.LeftBorder.Width]!==undefined)attr.LeftBorder.Width=enum.LineWidth[attr.LeftBorder.Width];
	attr.LeftBorder.Color=this.data.readUInt32LE(4);
	attr.RightBorder={};
	attr.RightBorder.Type=this.data.readUInt8(8);if(enum.LineType1[attr.RightBorder.Type]!==undefined)attr.RightBorder.Type=enum.LineType1[attr.RightBorder.Type];
	attr.RightBorder.Width=this.data.readUInt8(9);if(enum.LineWidth[attr.RightBorder.Width]!==undefined)attr.RightBorder.Width=enum.LineWidth[attr.RightBorder.Width];
	attr.RightBorder.Color=this.data.readUInt32LE(10);
	attr.TopBorder={};
	attr.TopBorder.Type=this.data.readUInt8(14);if(enum.LineType1[attr.TopBorder.Type]!==undefined)attr.TopBorder.Type=enum.LineType1[attr.TopBorder.Type];
	attr.TopBorder.Width=this.data.readUInt8(15);if(enum.LineWidth[attr.TopBorder.Width]!==undefined)attr.TopBorder.Width=enum.LineWidth[attr.TopBorder.Width];
	attr.TopBorder.Color=this.data.readUInt32LE(16);
	attr.BottomBorder={};
	attr.BottomBorder.Type=this.data.readUInt8(20);if(enum.LineType1[attr.BottomBorder.Type]!==undefined)attr.BottomBorder.Type=enum.LineType1[attr.BottomBorder.Type];
	attr.BottomBorder.Width=this.data.readUInt8(21);if(enum.LineWidth[attr.BottomBorder.Width]!==undefined)attr.BottomBorder.Width=enum.LineWidth[attr.BottomBorder.Width];
	attr.BottomBorder.Color=this.data.readUInt32LE(22);
	attr.Diagonal={};
	attr.Diagonal.Type=this.data.readUInt8(26);if(enum.LineType1[attr.Diagonal.Type]!==undefined)attr.Diagonal.Type=enum.LineType1[attr.Diagonal.Type];
	attr.Diagonal.Width=this.data.readUInt8(27);if(enum.LineWidth[attr.Diagonal.Width]!==undefined)attr.Diagonal.Width=enum.LineWidth[attr.Diagonal.Width];
	attr.Diagonal.Color=this.data.readUInt32LE(28);
	attr.FillBrush={};attr.FillBrush._BrushType=this.data.readUInt32LE(32);var offset={'value':36};switch(''+(attr.FillBrush._BrushType)){
	case "0":
	// TODO
	attr.FillBrush._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	break;
	case "1":
	attr.FillBrush.WindowBrush={};
	attr.FillBrush.WindowBrush.FaceColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.HatchColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.HatchStyle=this.data.readInt32LE(offset.value);if(enum.HatchStyle[attr.FillBrush.WindowBrush.HatchStyle]!==undefined)attr.FillBrush.WindowBrush.HatchStyle=enum.HatchStyle[attr.FillBrush.WindowBrush.HatchStyle]; offset.value+=4;
	// TODO
	attr.FillBrush.WindowBrush._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	break;
	case "4":
	attr.FillBrush.Gradation={};
	attr.FillBrush.Gradation.Type=this.data.readUInt8(offset.value);if(enum.GradationType[attr.FillBrush.Gradation.Type]!==undefined)attr.FillBrush.Gradation.Type=enum.GradationType[attr.FillBrush.Gradation.Type]; offset.value+=1;
	attr.FillBrush.Gradation.Angle=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.CenterX=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.CenterY=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.Step=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.ColorNum=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation._Colors=[];
	for(var ii1=0;ii1<attr.FillBrush.Gradation.ColorNum;ii1++){
		attr.FillBrush.Gradation._Colors[ii1]={};
		attr.FillBrush.Gradation._Colors[ii1].value=this.data.readUInt32LE(offset.value); offset.value+=4;
	}
	// TODO
	attr.FillBrush.Gradation._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.StepCenter=this.data.readUInt8(offset.value); offset.value+=1;
	attr.FillBrush.Gradation.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	break;
	default:
	console.warn("Warning [?>FillBrush]: not processing FillBrush Type '%s'", attr._BrushType);
	}
};
// 4.1.6. 글자 모양
root.record.CHAR_SHAPE = function Record_CHAR_SHAPE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="CHAR_SHAPE";
	attr._FontIDs=[];var offset={'value':0};
	for(var ii2=0;ii2<7;ii2++){
		attr._FontIDs[ii2]={};
		attr._FontIDs[ii2].value=this.data.readUInt16LE(offset.value); offset.value+=2;
	}
	attr._FontRatios=[];
	for(var ii3=0;ii3<7;ii3++){
		attr._FontRatios[ii3]={};
		attr._FontRatios[ii3].value=this.data.readUInt8(offset.value); offset.value+=1;
	}
	attr._FontCharSpacings=[];
	for(var ii4=0;ii4<7;ii4++){
		attr._FontCharSpacings[ii4]={};
		attr._FontCharSpacings[ii4].value=this.data.readInt8(offset.value); offset.value+=1;
	}
	attr._FontRelSizes=[];
	for(var ii5=0;ii5<7;ii5++){
		attr._FontRelSizes[ii5]={};
		attr._FontRelSizes[ii5].value=this.data.readUInt8(offset.value); offset.value+=1;
	}
	attr._FontCharOffsets=[];
	for(var ii6=0;ii6<7;ii6++){
		attr._FontCharOffsets[ii6]={};
		attr._FontCharOffsets[ii6].value=this.data.readInt8(offset.value); offset.value+=1;
	}
	attr.Height=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.Shadow={};
	attr.Underline={};
	attr.Strikeout={};
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr._Italic=!!(tmp[0]&0x1);
	attr._Bold=!!((tmp[0]&0x2)>>1);
	attr.Underline.Type=((tmp[0]&0xc)>>2);if(enum.UnderlineType[attr.Underline.Type]!==undefined)attr.Underline.Type=enum.UnderlineType[attr.Underline.Type];
	attr.Underline.Shape=((tmp[0]&0xf0)>>4);if(enum.LineType2[attr.Underline.Shape]!==undefined)attr.Underline.Shape=enum.LineType2[attr.Underline.Shape];
	attr.OutlineType=(tmp[1]&0x7);if(enum.LineType3[attr.OutlineType]!==undefined)attr.OutlineType=enum.LineType3[attr.OutlineType];
	attr.Shadow.Type=((tmp[1]&0x18)>>3);if(enum.ShadowType[attr.Shadow.Type]!==undefined)attr.Shadow.Type=enum.ShadowType[attr.Shadow.Type];
	attr._Emboss=!!((tmp[1]&0x20)>>5);
	attr._Engrave=!!((tmp[1]&0x40)>>6);
	attr._SuperScript=!!((tmp[1]&0x80)>>7);
	attr._SubScript=!!(tmp[2]&0x1);
	// 17: Reserved
	attr.Strikeout.Type=((tmp[2]&0x1c)>>2);if(enum.StrikeoutType[attr.Strikeout.Type]!==undefined)attr.Strikeout.Type=enum.StrikeoutType[attr.Strikeout.Type];
	// SymMark는 숫자임.
	attr.SymMark=((tmp[2]&0xe0)>>5)+((tmp[3]&0x1)<<3);
	attr.UseFontSpace=!!((tmp[3]&0x2)>>1);
	attr.Strikeout.Shape=((tmp[3]&0x3c)>>2);if(enum.LineType2[attr.Strikeout.Shape]!==undefined)attr.Strikeout.Shape=enum.LineType2[attr.Strikeout.Shape];
	attr.UseKerning=!!((tmp[3]&0x40)>>6);
	attr.Shadow.OffsetX=this.data.readInt8(offset.value); offset.value+=1;
	attr.Shadow.OffsetY=this.data.readInt8(offset.value); offset.value+=1;
	attr.TextColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.Underline.Color=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.ShadeColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.Shadow.Color=this.data.readUInt32LE(offset.value); offset.value+=4;
	if(offset.value>=this.data.length)return;
	// TODO: BorderFillId가 여기에 저장 안 될 때도 있는 것 같다.
	attr.BorderFillId=this.data.readUInt16LE(offset.value); offset.value+=2;
	if(offset.value>=this.data.length)return;
	attr.Strikeout.Color=this.data.readUInt32LE(offset.value); offset.value+=4;
};
// 4.1.7 탭 정의
root.record.TAB_DEF = function Record_TAB_DEF(data){
	var tmp,attr=this.attr={};this.data=data;this.name="TAB_DEF";
	tmp=this.data.slice(0,4);
	attr.AutoTabLeft=!!(tmp[0]&0x1);
	attr.AutoTabRight=!!((tmp[0]&0x2)>>1);
	// TODO: count 자세히 확인
	attr._count=this.data.readInt16LE(4);
	var offset={'value':6};if(attr._count){
	attr.TabItem={};
	attr.TabItem.Pos=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.TabItem.Type=this.data.readUInt8(offset.value);if(enum.TabItemType[attr.TabItem.Type]!==undefined)attr.TabItem.Type=enum.TabItemType[attr.TabItem.Type]; offset.value+=1;
	// TODO: LineType1? LineType2?
	attr.TabItem.Leader=this.data.readUInt8(offset.value);if(enum.LineType2[attr.TabItem.Leader]!==undefined)attr.TabItem.Leader=enum.LineType2[attr.TabItem.Leader]; offset.value+=1;
	}
};
// 4.1.8 문단 번호
root.record.NUMBERING = function Record_NUMBERING(data){
	var tmp,attr=this.attr={};this.data=data;this.name="NUMBERING";
	attr.ParaHeads=[];var offset={'value':0};
	for(var ii7=0;ii7<7;ii7++){
		attr.ParaHeads[ii7]={};
		tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.ParaHeads[ii7].Alignment=(tmp[0]&0x3);if(enum.AlignmentType2[attr.ParaHeads[ii7].Alignment]!==undefined)attr.ParaHeads[ii7].Alignment=enum.AlignmentType2[attr.ParaHeads[ii7].Alignment];
	attr.ParaHeads[ii7].UseInstWidth=!!((tmp[0]&0x4)>>2);
	attr.ParaHeads[ii7].AutoIndent=!!((tmp[0]&0x8)>>3);
	attr.ParaHeads[ii7].TextOffsetType=((tmp[0]&0x10)>>4);if(enum.TextOffsetType[attr.ParaHeads[ii7].TextOffsetType]!==undefined)attr.ParaHeads[ii7].TextOffsetType=enum.TextOffsetType[attr.ParaHeads[ii7].TextOffsetType];
	attr.ParaHeads[ii7].NumFormat=((tmp[0]&0xe0)>>5)+((tmp[1]&0x1)<<3);if(enum.NumberType1[attr.ParaHeads[ii7].NumFormat]!==undefined)attr.ParaHeads[ii7].NumFormat=enum.NumberType1[attr.ParaHeads[ii7].NumFormat];
		attr.ParaHeads[ii7].WidthAdjust=this.data.readUInt16LE(offset.value); offset.value+=2;
		attr.ParaHeads[ii7].TextOffset=this.data.readUInt16LE(offset.value); offset.value+=2;
		attr.ParaHeads[ii7].CharShape=this.data.readUInt32LE(offset.value); offset.value+=4;
		tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.ParaHeads[ii7].value='';tmp-->0;){attr.ParaHeads[ii7].value+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	}
	attr.Start=this.data.readUInt16LE(offset.value); offset.value+=2;
};
// 4.1.9 글머리표
root.record.BULLET = function Record_BULLET(data){
	var tmp,attr=this.attr={};this.data=data;this.name="BULLET";
	// TODO
};
// 4.1.10 문단 모양
root.record.PARA_SHAPE = function Record_PARA_SHAPE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_SHAPE";
	attr.ParaMargin={};
	attr.ParaBorder={};
	tmp=this.data.slice(0,4);
	// LineSpacingType이 2개 있음. (2007 이하, 초과)
	attr.ParaMargin.LineSpacingType=(tmp[0]&0x3);if(enum.LineSpacingType[attr.ParaMargin.LineSpacingType]!==undefined)attr.ParaMargin.LineSpacingType=enum.LineSpacingType[attr.ParaMargin.LineSpacingType];
	attr.Align=((tmp[0]&0x1c)>>2);if(enum.AlignmentType1[attr.Align]!==undefined)attr.Align=enum.AlignmentType1[attr.Align];
	attr.BreakLatinWord=((tmp[0]&0x60)>>5);if(enum.BreakLatinWordType[attr.BreakLatinWord]!==undefined)attr.BreakLatinWord=enum.BreakLatinWordType[attr.BreakLatinWord];
	// HML에서 true / false로 구분
	attr.BreakNonLatinWord=!!((tmp[0]&0x80)>>7);
	attr.SnapToGrid=!!(tmp[1]&0x1);
	attr.Condense=((tmp[1]&0xfe)>>1);
	attr.WidowOrphan=!!(tmp[2]&0x1);
	attr.KeepWithNext=!!((tmp[2]&0x2)>>1);
	attr.KeepLines=!!((tmp[2]&0x4)>>2);
	attr.PageBreakBefore=!!((tmp[2]&0x8)>>3);
	attr.VerAlign=((tmp[2]&0x30)>>4);if(enum.VerAlignType[attr.VerAlign]!==undefined)attr.VerAlign=enum.VerAlignType[attr.VerAlign];
	attr.FontLineHeight=!!((tmp[2]&0x40)>>6);
	attr.HeadingType=((tmp[2]&0x80)>>7)+((tmp[3]&0x1)<<1);if(enum.HeadingType[attr.HeadingType]!==undefined)attr.HeadingType=enum.HeadingType[attr.HeadingType];
	attr.Level=((tmp[3]&0xe)>>1);
	attr.ParaBorder.Connect=!!((tmp[3]&0x10)>>4);
	attr.ParaBorder.IgnoreMargin=!!((tmp[3]&0x20)>>5);
	// TODO: 문단 꼬리 모양
	attr.ParaMargin.Left=this.data.readInt32LE(4);
	attr.ParaMargin.Right=this.data.readInt32LE(8);
	// TODO: 간격 종류는 어디에서?
	attr.ParaMargin.Indent=this.data.readInt32LE(12);
	attr.ParaMargin.Prev=this.data.readInt32LE(16);
	attr.ParaMargin.Next=this.data.readInt32LE(20);
	// 2007 이하
	attr.ParaMargin.LineSpacing=this.data.readInt32LE(24);
	attr.TabDef=this.data.readUInt16LE(28);
	attr.Heading=this.data.readUInt16LE(30);
	attr.ParaBorder.BorderFill=this.data.readUInt16LE(32);
	attr.ParaBorder.OffsetLeft=this.data.readInt16LE(34);
	attr.ParaBorder.OffsetRight=this.data.readInt16LE(36);
	attr.ParaBorder.OffsetTop=this.data.readInt16LE(38);
	attr.ParaBorder.OffsetBottom=this.data.readInt16LE(40);
	tmp=this.data.slice(42,46);
	attr.LineWrap=(tmp[0]&0x3);if(enum.LineWrapType[attr.LineWrap]!==undefined)attr.LineWrap=enum.LineWrapType[attr.LineWrap];
	// 2~3: Reserved
	attr.AutoSpaceEAsianEng=!!((tmp[0]&0x10)>>4);
	attr.AutoSpaceEAsianNum=!!((tmp[0]&0x20)>>5);
	if(46>=this.data.length)return;
	tmp=this.data.slice(46,50);
	attr.ParaMargin.LineSpacingType=(tmp[0]&0x1f);if(enum.LineSpacingType[attr.ParaMargin.LineSpacingType]!==undefined)attr.ParaMargin.LineSpacingType=enum.LineSpacingType[attr.ParaMargin.LineSpacingType];
	attr.ParaMargin.LineSpacing=this.data.readUInt32LE(50);
};
// 4.1.11 스타일
root.record.STYLE = function Record_STYLE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="STYLE";
	tmp=this.data.readUInt16LE(0);var offset={'value':2};for(attr.Name='';tmp-->0;){attr.Name+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.EngName='';tmp-->0;){attr.EngName+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	tmp=this.data.slice(offset.value,(offset.value+1)); offset.value+=1;
	attr.Type=(tmp[0]&0x7);if(enum.StyleType[attr.Type]!==undefined)attr.Type=enum.StyleType[attr.Type];
	attr.NextStyle=this.data.readUInt8(offset.value); offset.value+=1;
	attr.LangId=this.data.readInt16LE(offset.value); offset.value+=2;
	attr.ParaShape=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.CharShape=this.data.readUInt16LE(offset.value); offset.value+=2;
};
// 4.1.12 문서 임의의 데이터
root.record.DOC_DATA = function Record_DOC_DATA(data){
	var tmp,attr=this.attr={};this.data=data;this.name="DOC_DATA";
};
// 4.1.13 배포용 문서 데이터 (TODO: 이 데이터의 의미 찾기)
root.record.DISTRIBUTE_DOC_DATA = function Record_DISTRIBUTE_DOC_DATA(data){
	var tmp,attr=this.attr={};this.data=data;this.name="DISTRIBUTE_DOC_DATA";
	attr.Data=this.data.slice(0,256);
};
// 4.1.14 호환 문서 (TODO: enum)
root.record.COMPATIBLE_DOCUMENT = function Record_COMPATIBLE_DOCUMENT(data){
	var tmp,attr=this.attr={};this.data=data;this.name="COMPATIBLE_DOCUMENT";
	attr.TargetProgram=this.data.readUInt32LE(0);
};
// 4.1.15 레이아웃 호환성 (TODO: 각각의 필드가 뜻하는 것 찾기)
root.record.LAYOUT_COMPATIBILITY = function Record_LAYOUT_COMPATIBILITY(data){
	var tmp,attr=this.attr={};this.data=data;this.name="LAYOUT_COMPATIBILITY";
	attr._Char=this.data.readUInt32LE(0);
	attr._Para=this.data.readUInt32LE(4);
	attr._Sec=this.data.readUInt32LE(8);
	attr._Obj=this.data.readUInt32LE(12);
	attr._Field=this.data.readUInt32LE(16);
};
// ??? 금칙 문자 (TODO: 항상 필드 4개인지 확인하기)
root.record.FORBIDDEN_CHAR = function Record_FORBIDDEN_CHAR(data){
	var tmp,attr=this.attr={};this.data=data;this.name="FORBIDDEN_CHAR";
	attr._f0_len=this.data.readUInt32LE(0);
	attr._f1_len=this.data.readUInt32LE(4);
	attr._f2_len=this.data.readUInt32LE(8);
	attr._f3_len=this.data.readUInt32LE(12);
	var offset={'value':16};var read_str = function(len, label){
			if(len == 0) attr[label] = "\x20";
			else{
				attr[label] = "";
				while(len-->0){
					attr[label] += String.fromCharCode(
						data.readUInt16LE(offset.value)
					);
					offset.value += 2;
				}
			}
		};
		read_str(attr._f0_len, "_f0");
		read_str(attr._f1_len, "_f1");
		read_str(attr._f2_len, "_f2");
		read_str(attr._f3_len, "_f3");
};
// 4.2.1. 문단 헤더
root.record.PARA_HEADER = function Record_PARA_HEADER(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_HEADER";
	// TODO: text, control_mask가 뜻하는 것 찾기
	attr._text=this.data.readUInt32LE(0);
	attr._control_mask=this.data.readUInt32LE(4);
	attr.ParaShape=this.data.readUInt16LE(8);
	attr.Style=this.data.readUInt8(10);
	// TODO: 0, 1 -> ?
	tmp=this.data.slice(11,12);
	attr.PageBreak=!!((tmp[0]&0x4)>>2);
	attr.ColumnBreak=!!((tmp[0]&0x8)>>3);
	// TODO: 아래 필드들 이용하기
	attr.CharShapeCount=this.data.readUInt16LE(12);
	attr.RangeTagCount=this.data.readUInt16LE(14);
	attr.AlignInfoCount=this.data.readUInt16LE(16);
	attr.InstId=this.data.readUInt32LE(18);
};
// 4.2.2. 문단의 텍스트
root.record.PARA_TEXT = function Record_PARA_TEXT(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_TEXT";
	// 길이가 저장되지 않는 듯 함.
	var offset={'value':0};var i, c, buf = [], bi = 0;
		this.text = []; tmp = 0;
		
		var flushBuffer = (function(x){
			var y = tmp;
			if(buf.length == 0 && !x) return;
			if(tmp){
				this.text.push({
					'type': tmp,
					'start': bi/2,
					'data': buf
				});
				tmp = 0;
			}else{
				this.text.push({
					'type': 'text',
					'start': bi/2,
					'data': buf
				});
			}
			if(x){
				this.text.push({
					'type': x,
					'start': i/2
				});
				bi = i+2;
			}else if(y){
				bi = i+2;
			}else{
				bi = i;
			}
			buf = [];
		}).bind(this);

		for(i=0; i<data.length; i+=2){
			c = data.readUInt16LE(i);
			/* in extended? */
			if(tmp){
				/* Is closing? */
				if(c == tmp){
					flushBuffer();
				}else{
					buf.push(c);
				}
			}else{
				switch(c){
					case 0: case 25: case 26: case 27: case 28: case 29:
						/* Reserved */
						break;
					case 13:
						/* TODO */
						break;
					case 10: case 24: case 30: case 31:
						flushBuffer(c);
						break;
					default:
						if(c<32){
							flushBuffer(); tmp = c;
						}else{
							buf.push(c);
						}
				}
			}
		}

		flushBuffer();
	// Text 형식: type=text 또는 type=숫자, start는 시작 지점, data는 데이터
};
// 4.2.3. 문단의 글자 모양
root.record.PARA_CHAR_SHAPE = function Record_PARA_CHAR_SHAPE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_CHAR_SHAPE";
	var offset={'value':0};this.values = [];
		for(tmp=0; tmp<data.length; tmp+=8){
			this.values.push({
				'start': data.readUInt32LE(tmp),
				'charShape': data.readUInt32LE(tmp+4)
			});
		};
};
// 4.2.4. 문단의 레이아웃
root.record.PARA_LINE_SEG = function Record_PARA_LINE_SEG(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_LINE_SEG";
	// TODO: 적외선 굴절기 제조법 찾기
};
// 4.2.5. 문단의 영역 태그
root.record.PARA_RANGE_TAG = function Record_PARA_RANGE_TAG(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PARA_RANGE_TAG";
	attr._Data=[];var offset={'value':0};
	for(var ii8=0;offset.value<this.data.length;ii8++){
		attr._Data[ii8]={};
		attr._Data[ii8].start=this.data.readUInt32LE(offset.value); offset.value+=4;
		attr._Data[ii8].end=this.data.readUInt32LE(offset.value); offset.value+=4;
		attr._Data[ii8].data=this.data.readUInt32LE(offset.value); offset.value+=4;
	}
};
// 4.2.6. 컨트롤 헤더
root.record.CTRL_HEADER = function Record_CTRL_HEADER(data){
	var tmp,attr=this.attr={};this.data=data;this.name="CTRL_HEADER";
	// TODO: 적절한 이름 정하기
	tmp=this.data.readUInt32LE(0);attr._Type=String.fromCharCode(tmp>>24,tmp>>16&0xFF,tmp>>8&0xFF,tmp&0xFF);
	// 개체 공통 속성 읽기
	var offset={'value':4};switch(''+(attr._Type)){
	case "eqed": case "tbl ": case "gso ":
	attr.ShapeObject={};
	attr.ShapeObject.Size={};
	attr.ShapeObject.Position={};
	attr.ShapeObject.OutsideMargin={};
	attr.ShapeObject.ShapeComment={};
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.ShapeObject.Position.TreatAsChar=!!(tmp[0]&0x1);
	// 1: Reserved
	attr.ShapeObject.Position.AffectLSpacing=!!((tmp[0]&0x4)>>2);
	attr.ShapeObject.Position.VertRelTo=((tmp[0]&0x18)>>3);if(enum.VertRelToType[attr.ShapeObject.Position.VertRelTo]!==undefined)attr.ShapeObject.Position.VertRelTo=enum.VertRelToType[attr.ShapeObject.Position.VertRelTo];
	// TODO_SOMETIME: 문서 설명 참고
	attr.ShapeObject.Position.VertAlign=((tmp[0]&0xe0)>>5);if(enum.VertAlignType[attr.ShapeObject.Position.VertAlign]!==undefined)attr.ShapeObject.Position.VertAlign=enum.VertAlignType[attr.ShapeObject.Position.VertAlign];
	attr.ShapeObject.Position.HorzRelTo=(tmp[1]&0x3);if(enum.HorzRelToType[attr.ShapeObject.Position.HorzRelTo]!==undefined)attr.ShapeObject.Position.HorzRelTo=enum.HorzRelToType[attr.ShapeObject.Position.HorzRelTo];
	attr.ShapeObject.Position.HorzAlign=((tmp[1]&0x1c)>>2);if(enum.HorzAlignType[attr.ShapeObject.Position.HorzAlign]!==undefined)attr.ShapeObject.Position.HorzAlign=enum.HorzAlignType[attr.ShapeObject.Position.HorzAlign];
	attr.ShapeObject.Position.FlowWithText=!!((tmp[1]&0x20)>>5);
	attr.ShapeObject.Position.AllowOverlap=!!((tmp[1]&0x40)>>6);
	attr.ShapeObject.Size.WidthRelTo=((tmp[1]&0x80)>>7)+((tmp[2]&0x3)<<1);if(enum.WidthRelToType[attr.ShapeObject.Size.WidthRelTo]!==undefined)attr.ShapeObject.Size.WidthRelTo=enum.WidthRelToType[attr.ShapeObject.Size.WidthRelTo];
	attr.ShapeObject.Size.HeightRelTo=((tmp[2]&0xc)>>2);if(enum.HeightRelToType[attr.ShapeObject.Size.HeightRelTo]!==undefined)attr.ShapeObject.Size.HeightRelTo=enum.HeightRelToType[attr.ShapeObject.Size.HeightRelTo];
	attr.ShapeObject.Size.Protect=!!((tmp[2]&0x10)>>4);
	attr.ShapeObject.TextWrap=((tmp[2]&0xe0)>>5);if(enum.TextWrapType[attr.ShapeObject.TextWrap]!==undefined)attr.ShapeObject.TextWrap=enum.TextWrapType[attr.ShapeObject.TextWrap];
	attr.ShapeObject.TextFlow=(tmp[3]&0x3);if(enum.TextFlowType[attr.ShapeObject.TextFlow]!==undefined)attr.ShapeObject.TextFlow=enum.TextFlowType[attr.ShapeObject.TextFlow];
	attr.ShapeObject.NumberingType=((tmp[3]&0x1c)>>2);if(enum.NumberingType[attr.ShapeObject.NumberingType]!==undefined)attr.ShapeObject.NumberingType=enum.NumberingType[attr.ShapeObject.NumberingType];
	attr.ShapeObject.Position.VertOffset=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.ShapeObject.Position.HorzOffset=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.ShapeObject.Size.Width=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.ShapeObject.Size.Height=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.ShapeObject.ZOrder=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.ShapeObject.OutsideMargin.Left=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.ShapeObject.OutsideMargin.Right=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.ShapeObject.OutsideMargin.Top=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.ShapeObject.OutsideMargin.Bottom=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.ShapeObject.InstId=this.data.readUInt32LE(offset.value); offset.value+=4;
	if(offset.value>=this.data.length)return;
	// TODO_SOMETIME: 이 4 바이트의 정체는? (캡션 수?)
	attr.ShapeObject._unknown=this.data.readUInt32LE(offset.value); offset.value+=4;
	if(offset.value>=this.data.length)return;
	tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.ShapeObject.ShapeComment.value='';tmp-->0;){attr.ShapeObject.ShapeComment.value+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	break;
	}
	switch(''+(attr._Type)){
	case "eqed": case "tbl ": case "gso ":
	// 아무 데이터도 없음 / 이미 위에서 끝남
	break;
	case "secd":
	// Section Definition
	attr.Hide={};
	attr.StartNumber={};
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.Hide.Header=!!(tmp[0]&0x1);
	attr.Hide.Footer=!!((tmp[0]&0x2)>>1);
	attr.Hide.MasterPage=!!((tmp[0]&0x4)>>2);
	attr.Hide.Border=!!((tmp[0]&0x8)>>3);
	attr.Hide.Fill=!!((tmp[0]&0x10)>>4);
	attr.Hide.PageNumPos=!!((tmp[0]&0x20)>>5);
	attr.FirstBorder=!!(tmp[1]&0x1);
	attr.FirstFill=!!((tmp[1]&0x2)>>1);
	attr.TextDirection=(tmp[2]&0x7);
	attr.Hide.EmptyLine=!!((tmp[2]&0x8)>>3);
	attr.StartNumber.PageStartsOn=((tmp[2]&0x30)>>4);if(enum.PageStartsOnType[attr.StartNumber.PageStartsOn]!==undefined)attr.StartNumber.PageStartsOn=enum.PageStartsOnType[attr.StartNumber.PageStartsOn];
	// TODO: 22: 원고지 정서법 적용 여부
	attr.SpaceColumns=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.LineGrid=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.CharGrid=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.TabStop=this.data.readUInt32LE(offset.value); offset.value+=4;
	// TODO: Page 기본값은 0? 1?
	attr.StartNumber.Page=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.StartNumber.Figure=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.StartNumber.Table=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.StartNumber.Equation=this.data.readUInt16LE(offset.value); offset.value+=2;
	// TODO: 뭔가 빠진 듯 한데
	// TODO_SOMETIME: 뒤에 다른 설정 데이터가 같이 있나?
	break;
	case "cold":
	tmp=this.data.slice(offset.value,(offset.value+2)); offset.value+=2;
	attr.Type=(tmp[0]&0x3);if(enum.ColDefType[attr.Type]!==undefined)attr.Type=enum.ColDefType[attr.Type];
	attr.Count=((tmp[0]&0xfc)>>2)+((tmp[1]&0x3)<<6);
	attr.Layout=((tmp[1]&0xc)>>2);if(enum.LayoutType[attr.Layout]!==undefined)attr.Layout=enum.LayoutType[attr.Layout];
	attr.SameSize=!!((tmp[1]&0x10)>>4);
	// TODO: 데이터 더 읽기. (다양한 경우에 대해 조사)
	break;
	case "pgnp":
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.FormatType=tmp[0];if(enum.NumberType1[attr.FormatType]!==undefined)attr.FormatType=enum.NumberType1[attr.FormatType];
	attr.Pos=(tmp[1]&0xf);if(enum.PosType[attr.Pos]!==undefined)attr.Pos=enum.PosType[attr.Pos];
	// TODO: 데이터 더 읽기. (최신 버전에 대해 조사)
	break;
	default:
	console.warn("Warning [CTRL_HEADER]: not processing Control Type '%s'", attr._Type);
	}
};
// 4.2.7. 문단 리스트 헤드
root.record.LIST_HEADER = function Record_LIST_HEADER(data){
	var tmp,attr=this.attr={};this.data=data;this.name="LIST_HEADER";
	// TODO: DOC: 이게 정말 32비트인지, 아니면 16비트의 다른 필드가 더 있는지 확인하기
	attr._ParaCount=this.data.readInt32LE(0);
	// DOC: 문서와 오프셋, 크기가 다른 듯.
	tmp=this.data.slice(4,6);
	attr.TextDirection=(tmp[0]&0x7);
	attr.LineWrap=((tmp[0]&0x18)>>3);if(enum.LineWrapType[attr.LineWrap]!==undefined)attr.LineWrap=enum.LineWrapType[attr.LineWrap];
	attr.VertAlign=((tmp[0]&0x60)>>5);if(enum.VertAlignType[attr.VertAlign]!==undefined)attr.VertAlign=enum.VertAlignType[attr.VertAlign];
	// 다른 객체(예: LIST_CELL, LIST_DRAWTEXT)들이 이 레코드 뒤에 담겨 있는 듯.
	var offset={'value':6};this.offset = offset.value;
};
// 4.2.8. 컨트롤 임의의 데이터
root.record.CTRL_DATA = function Record_CTRL_DATA(data){
	var tmp,attr=this.attr={};this.data=data;this.name="CTRL_DATA";
};
// 4.2.9. 개체 공통 속성을 포함하는 컨트롤
// 4.2.9.1. 표 개체
root.record.TABLE = function Record_TABLE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="TABLE";
	tmp=this.data.slice(0,4);
	attr.PageBreak=(tmp[0]&0x3);if(enum.PageBreakType[attr.PageBreak]!==undefined)attr.PageBreak=enum.PageBreakType[attr.PageBreak];
	attr.RepeatHeader=!!((tmp[0]&0x4)>>2);
	// TODO_SOMETIME: 여기에 뭔가 있다.
	attr.RowCount=this.data.readUInt16LE(4);
	attr.ColCount=this.data.readUInt16LE(6);
	attr.CellSpacing=this.data.readUInt16LE(8);
	attr.InsideMargin={};
	attr.InsideMargin.Left=this.data.readUInt16LE(10);
	attr.InsideMargin.Right=this.data.readUInt16LE(12);
	attr.InsideMargin.Top=this.data.readUInt16LE(14);
	attr.InsideMargin.Bottom=this.data.readUInt16LE(16);
	attr._RowSizes=[];var offset={'value':18};
	for(var ii9=0;ii9<attr.RowCount;ii9++){
		attr._RowSizes[ii9]={};
		attr._RowSizes[ii9].value=this.data.readUInt16LE(offset.value); offset.value+=2;
	}
	attr.BorderFill=this.data.readUInt16LE(offset.value); offset.value+=2;
	// TODO_SOMETIME: Valid Zone Info
};
// LIST_HEADER가 앞에 있는 CELL
root.record.LIST_CELL = function Record_LIST_CELL(data){
	var tmp,attr=this.attr={};this.data=data;this.name="LIST_CELL";
	// DOC: 문서에 설명이 없음!
	tmp=this.data.slice(0,2);
	attr.HasMargin=!!(tmp[0]&0x1);
	attr.Protect=!!((tmp[0]&0x2)>>1);
	attr.Header=!!((tmp[0]&0x4)>>2);
	attr.Editable=!!((tmp[0]&0x8)>>3);
	// TODO_SOMETIME: DIRTY?
	attr.ColAddr=this.data.readUInt16LE(2);
	attr.RowAddr=this.data.readUInt16LE(4);
	attr.ColSpan=this.data.readUInt16LE(6);
	attr.RowSpan=this.data.readUInt16LE(8);
	attr.Width=this.data.readUInt32LE(10);
	attr.Height=this.data.readUInt32LE(14);
	attr.CellMargin={};
	attr.CellMargin.Left=this.data.readUInt16LE(18);
	attr.CellMargin.Right=this.data.readUInt16LE(20);
	attr.CellMargin.Top=this.data.readUInt16LE(22);
	attr.CellMargin.Bottom=this.data.readUInt16LE(24);
	attr.BorderFill=this.data.readUInt16LE(26);
	// TODO_SOMETIME: Name
};
// 4.2.9.2. 그리기 개체
// 4.2.9.2.1. 개체 요소
root.record.SHAPE_COMPONENT = function Record_SHAPE_COMPONENT(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT";
	// TODO: DOC: 루트인 경우에만 이 값이 중복되는 것 같은데, 확인할 것!
	tmp=this.data.readUInt32LE(0);attr._Type=String.fromCharCode(tmp>>24,tmp>>16&0xFF,tmp>>8&0xFF,tmp&0xFF);
	tmp=this.data.readUInt32LE(4);attr._Type2=String.fromCharCode(tmp>>24,tmp>>16&0xFF,tmp>>8&0xFF,tmp&0xFF);
	var offset={'value':8};attr._IsDup = attr._Type == attr._Type2;
		if(!attr._IsDup) offset.value -= 4;
	attr.XPos=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.YPos=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.GroupLevel=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr._LocalFileVersion=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.OriWidth=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.OriHeight=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.CurWidth=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.CurHeight=this.data.readInt32LE(offset.value); offset.value+=4;
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.HorzFlip=!!(tmp[0]&0x1);
	attr.VertFlip=!!((tmp[0]&0x2)>>1);
	// TODO_SOMETIME: 16, 19번째 비트
	attr.RotationInfo={};
	attr.RotationInfo.Angle=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.RotationInfo.CenterX=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.RotationInfo.CenterY=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.RenderingInfo={};
	attr.RenderingInfo._Count=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.RenderingInfo.TransMatrix={};
	attr.RenderingInfo.TransMatrix.E1=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo.TransMatrix.E2=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo.TransMatrix.E3=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo.TransMatrix.E4=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo.TransMatrix.E5=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo.TransMatrix.E6=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices=[];
	for(var ii10=0;ii10<attr.RenderingInfo._Count;ii10++){
		attr.RenderingInfo._ScaRotMatrices[ii10]={};
		attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix={};
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E1=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E2=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E3=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E4=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E5=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].ScaMatrix.E6=this.data.readDoubleLE(offset.value); offset.value+=8;
		attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix={};
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E1=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E2=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E3=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E4=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E5=this.data.readDoubleLE(offset.value); offset.value+=8;
	attr.RenderingInfo._ScaRotMatrices[ii10].RotMatrix.E6=this.data.readDoubleLE(offset.value); offset.value+=8;
	}
	switch(''+(attr._Type)){
	case "$ole":
	// 추가 데이터 없음
	break;
	case "$con":
	attr._Count=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr._CTypes=[];
	for(var ii11=0;ii11<attr._Count;ii11++){
		attr._CTypes[ii11]={};
		tmp=this.data.readUInt32LE(offset.value);attr._CTypes[ii11].value=String.fromCharCode(tmp>>24,tmp>>16&0xFF,tmp>>8&0xFF,tmp&0xFF); offset.value+=4;
	}
	attr.InstID=this.data.readUInt32LE(offset.value); offset.value+=4;
	break;
	case "$rec": case "$lin": case "$ell": case "$col": case "$pol": case "$arc": case "$cur":
	attr.LineShape={};
	attr.LineShape.Color=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.LineShape.Width=this.data.readInt32LE(offset.value); offset.value+=4;
	tmp=this.data.slice(offset.value,(offset.value+4)); offset.value+=4;
	attr.LineShape.Style=(tmp[0]&0x3f);if(enum.LineType1[attr.LineShape.Style]!==undefined)attr.LineShape.Style=enum.LineType1[attr.LineShape.Style];
	attr.LineShape.EndCap=((tmp[0]&0xc0)>>6)+((tmp[1]&0x3)<<2);if(enum.EndCapType[attr.LineShape.EndCap]!==undefined)attr.LineShape.EndCap=enum.EndCapType[attr.LineShape.EndCap];
	attr.LineShape.HeadStyle=((tmp[1]&0xfc)>>2);if(enum.ArrowType[attr.LineShape.HeadStyle]!==undefined)attr.LineShape.HeadStyle=enum.ArrowType[attr.LineShape.HeadStyle];
	attr.LineShape.TailStyle=(tmp[2]&0x3f);if(enum.ArrowType[attr.LineShape.TailStyle]!==undefined)attr.LineShape.TailStyle=enum.ArrowType[attr.LineShape.TailStyle];
	attr.LineShape.HeadSize=((tmp[2]&0xc0)>>6)+((tmp[3]&0x3)<<2);if(enum.ArrowSize[attr.LineShape.HeadSize]!==undefined)attr.LineShape.HeadSize=enum.ArrowSize[attr.LineShape.HeadSize];
	attr.LineShape.TailSize=((tmp[3]&0x3c)>>2);if(enum.ArrowSize[attr.LineShape.TailSize]!==undefined)attr.LineShape.TailSize=enum.ArrowSize[attr.LineShape.TailSize];
	attr.LineShape._HeadFilled=!!((tmp[3]&0x40)>>6);
	attr.LineShape._TailFilled=!!((tmp[3]&0x80)>>7);
	var adjustArrSize = function adjustArrSize(x){
						if(attr.LineShape["_"+x+"Filled"]){
							var v = attr.LineShape[x+"Style"];
							if(v.slice(0,5) == "Empty"){
								attr.LineShape[x+"Style"] = "Filled"+v.slice(5);
							}
						}
					};
					adjustArrSize.call(this, "Head");
					adjustArrSize.call(this, "Tail");
	attr.LineShape.OutlineStyle=this.data.readUInt8(offset.value);if(enum.OutlineStyleType[attr.LineShape.OutlineStyle]!==undefined)attr.LineShape.OutlineStyle=enum.OutlineStyleType[attr.LineShape.OutlineStyle]; offset.value+=1;
	attr.FillBrush={};attr.FillBrush._BrushType=this.data.readUInt32LE(offset.value); offset.value+=4;switch(''+(attr.FillBrush._BrushType)){
	case "0":
	// TODO
	attr.FillBrush._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	break;
	case "1":
	attr.FillBrush.WindowBrush={};
	attr.FillBrush.WindowBrush.FaceColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.HatchColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.HatchStyle=this.data.readInt32LE(offset.value);if(enum.HatchStyle[attr.FillBrush.WindowBrush.HatchStyle]!==undefined)attr.FillBrush.WindowBrush.HatchStyle=enum.HatchStyle[attr.FillBrush.WindowBrush.HatchStyle]; offset.value+=4;
	// TODO
	attr.FillBrush.WindowBrush._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.WindowBrush.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	break;
	case "4":
	attr.FillBrush.Gradation={};
	attr.FillBrush.Gradation.Type=this.data.readUInt8(offset.value);if(enum.GradationType[attr.FillBrush.Gradation.Type]!==undefined)attr.FillBrush.Gradation.Type=enum.GradationType[attr.FillBrush.Gradation.Type]; offset.value+=1;
	attr.FillBrush.Gradation.Angle=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.CenterX=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.CenterY=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.Step=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.ColorNum=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation._Colors=[];
	for(var ii12=0;ii12<attr.FillBrush.Gradation.ColorNum;ii12++){
		attr.FillBrush.Gradation._Colors[ii12]={};
		attr.FillBrush.Gradation._Colors[ii12].value=this.data.readUInt32LE(offset.value); offset.value+=4;
	}
	// TODO
	attr.FillBrush.Gradation._Unknown=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.FillBrush.Gradation.StepCenter=this.data.readUInt8(offset.value); offset.value+=1;
	attr.FillBrush.Gradation.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	break;
	default:
	console.warn("Warning [?>FillBrush]: not processing FillBrush Type '%s'", attr._BrushType);
	}
	attr.Shadow={};
	attr.Shadow.Type=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.Shadow.Color=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.Shadow.OffsetX=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.Shadow.OffsetY=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.InstID=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.LineShape.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	attr.Shadow.Alpha=this.data.readUInt8(offset.value); offset.value+=1;
	break;
	default:
	console.warn("Warning [SHAPE_COMPONENT]: not processing ShapeComponent Type '%s'", attr._Type);
				console.warn("%s | %s", attr._Type, bufferToString(data.slice(offset.value)))
	}
};
// 4.2.9.2.2. 선 개체
root.record.SHAPE_COMPONENT_LINE = function Record_SHAPE_COMPONENT_LINE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_LINE";
	attr.StartX=this.data.readInt32LE(0);
	attr.StartY=this.data.readInt32LE(4);
	attr.EndX=this.data.readInt32LE(8);
	attr.EndY=this.data.readInt32LE(12);
	// DOC: 이곳이 4바이트인 것 같음
	tmp=this.data.slice(16,18);
	attr.IsReverseHV=!!(tmp[0]&0x1);
};
// SHAPE_COMPONENT_LINE과 같고, 부모의 타입으로 알아 내야 됨.
root.record.SHAPE_COMPONENT_CONNECTLINE = function Record_SHAPE_COMPONENT_CONNECTLINE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_CONNECTLINE";
	attr.StartX=this.data.readInt32LE(0);
	attr.StartY=this.data.readInt32LE(4);
	attr.EndX=this.data.readInt32LE(8);
	attr.EndY=this.data.readInt32LE(12);
	attr.Type=this.data.readInt32LE(16);
	attr.StartSubjectID=this.data.readUInt32LE(20);
	attr.StartSubjectIndex=this.data.readUInt32LE(24);
	attr.EndSubjectID=this.data.readUInt32LE(28);
	attr.EndSubjectIndex=this.data.readUInt32LE(32);
	attr._Count=this.data.readUInt32LE(36);
	attr._ControlPoints=[];var offset={'value':40};
	for(var ii13=0;ii13<attr._Count;ii13++){
		attr._ControlPoints[ii13]={};
		attr._ControlPoints[ii13].X=this.data.readInt32LE(offset.value); offset.value+=4;
		attr._ControlPoints[ii13].Y=this.data.readInt32LE(offset.value); offset.value+=4;
		attr._ControlPoints[ii13].Type=this.data.readUInt16LE(offset.value); offset.value+=2;
	}
	// TODO_SOMETIME: 뒤에 뭐가 더 있는 것 같음 (4바이트)
};
// 4.2.9.2.3. 사각형 개체
root.record.SHAPE_COMPONENT_RECTANGLE = function Record_SHAPE_COMPONENT_RECTANGLE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_RECTANGLE";
	attr.Ratio=this.data.readUInt8(0);
	// DOC: 문서와 다르게 이렇게 저장됨
	attr.X0=this.data.readInt32LE(1);
	attr.Y0=this.data.readInt32LE(5);
	attr.X1=this.data.readInt32LE(9);
	attr.Y1=this.data.readInt32LE(13);
	attr.X2=this.data.readInt32LE(17);
	attr.Y2=this.data.readInt32LE(21);
	attr.X3=this.data.readInt32LE(25);
	attr.Y3=this.data.readInt32LE(29);
};
// 4.2.9.2.4. 타원 개체
root.record.SHAPE_COMPONENT_ELLIPSE = function Record_SHAPE_COMPONENT_ELLIPSE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_ELLIPSE";
	tmp=this.data.slice(0,4);
	attr.IntervalDirty=!!(tmp[0]&0x1);
	attr.HasArcProperty=!!((tmp[0]&0x2)>>1);
	// TODO: DOC: 2~7은?
	attr.ArcType=(tmp[1]&0x3);if(enum.ArcType[attr.ArcType]!==undefined)attr.ArcType=enum.ArcType[attr.ArcType];
	attr.CenterX=this.data.readInt32LE(4);
	attr.CenterY=this.data.readInt32LE(8);
	attr.Axis1X=this.data.readInt32LE(12);
	attr.Axis1Y=this.data.readInt32LE(16);
	attr.Axis2X=this.data.readInt32LE(20);
	attr.Axis2Y=this.data.readInt32LE(24);
	attr.Start1X=this.data.readInt32LE(28);
	attr.Start1Y=this.data.readInt32LE(32);
	attr.End1X=this.data.readInt32LE(36);
	attr.End1Y=this.data.readInt32LE(40);
	attr.Start2X=this.data.readInt32LE(44);
	attr.Start2Y=this.data.readInt32LE(48);
	attr.End2X=this.data.readInt32LE(52);
	attr.End2Y=this.data.readInt32LE(56);
};
// 4.2.9.2.5. 다각형 개체
root.record.SHAPE_COMPONENT_POLYGON = function Record_SHAPE_COMPONENT_POLYGON(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_POLYGON";
	// DOC: 32비트임
	attr._Count=this.data.readUInt32LE(0);
	// DOC: 이렇게 저장됨
	attr._Points=[];var offset={'value':4};
	for(var ii14=0;ii14<attr._Count;ii14++){
		attr._Points[ii14]={};
		attr._Points[ii14].X=this.data.readInt32LE(offset.value); offset.value+=4;
		attr._Points[ii14].Y=this.data.readInt32LE(offset.value); offset.value+=4;
	}
	// TODO_SOMETIME: 뒤에 뭐가 더 있는 것 같음 (4바이트)
};
// 4.2.9.2.6. 호 개체
root.record.SHAPE_COMPONENT_ARC = function Record_SHAPE_COMPONENT_ARC(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_ARC";
	// TODO: DOC: 이 1바이트가 Type인 것 같은데, 확인하기
	attr._Type=this.data.readUInt8(0);
	attr.CenterX=this.data.readInt32LE(1);
	attr.CenterY=this.data.readInt32LE(5);
	attr.Axis1X=this.data.readInt32LE(9);
	attr.Axis1Y=this.data.readInt32LE(13);
	attr.Axis2X=this.data.readInt32LE(17);
	attr.Axis2Y=this.data.readInt32LE(21);
};
// 4.2.9.2.7. 곡선 개체
root.record.SHAPE_COMPONENT_CURVE = function Record_SHAPE_COMPONENT_CURVE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_CURVE";
	// DOC: 32비트임
	attr._Count=this.data.readUInt32LE(0);
	// DOC: 이렇게 저장됨
	attr._Points=[];var offset={'value':4};
	for(var ii15=0;ii15<attr._Count;ii15++){
		attr._Points[ii15]={};
		attr._Points[ii15]._X=this.data.readInt32LE(offset.value); offset.value+=4;
		attr._Points[ii15]._Y=this.data.readInt32LE(offset.value); offset.value+=4;
	}
	attr._Count--;
	attr._Types=[];
	for(var ii16=0;ii16<attr._Count;ii16++){
		attr._Types[ii16]={};
		attr._Types[ii16].value=this.data.readUInt8(offset.value);if(enum.SegmentType[attr._Types[ii16].value]!==undefined)attr._Types[ii16].value=enum.SegmentType[attr._Types[ii16].value]; offset.value+=1;
	}
	attr._Count++;
	// TODO_SOMETIME: 다각형 개체처럼 뒤에 뭐가 더 있음.
};
// LIST_HEADER가 앞에 있는 DRAWTEXT
root.record.LIST_DRAWTEXT = function Record_LIST_DRAWTEXT(data){
	var tmp,attr=this.attr={};this.data=data;this.name="LIST_DRAWTEXT";
	attr._Unknown1=this.data.readUInt16LE(0);
	attr.TextMargin={};
	attr.TextMargin.Left=this.data.readUInt16LE(2);
	attr.TextMargin.Right=this.data.readUInt16LE(4);
	attr.TextMargin.Top=this.data.readUInt16LE(6);
	attr.TextMargin.Bottom=this.data.readUInt16LE(8);
	attr.LastWidth=this.data.readUInt32LE(10);
	// TODO: 더 채워넣기
};
// 4.2.9.3. 한글 스크립트 수식 (한글 97 방식 수식)
root.record.EQEDIT = function Record_EQEDIT(data){
	var tmp,attr=this.attr={};this.data=data;this.name="EQEDIT";
	tmp=this.data.slice(0,4);
	attr.LineMode=!!(tmp[0]&0x1);
	attr.Script={};
	tmp=this.data.readUInt16LE(4);var offset={'value':6};for(attr.Script.value='';tmp-->0;){attr.Script.value+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
	attr.BaseUnit=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.TextColor=this.data.readUInt32LE(offset.value); offset.value+=4;
	attr.BaseLine=this.data.readInt16LE(offset.value); offset.value+=2;
	// TODO_SOMETIME: 이것 뜻 찾기
	attr._unknown=this.data.readInt16LE(offset.value); offset.value+=2;
	// 문서에 없는 것
	tmp=this.data.readUInt16LE(offset.value); offset.value+=2;for(attr.Version='';tmp-->0;){attr.Version+=String.fromCharCode(this.data.readUInt16LE(offset.value)); offset.value+=2;}
};
// 4.2.9.4. 그림 개체
// TODO 이게 정말 맞는 건지 확인하기
root.record.SHAPE_COMPONENT_PICTURE = function Record_SHAPE_COMPONENT_PICTURE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_PICTURE";
	// TODO
};
// 4.2.9.5. OLE 개체
root.record.SHAPE_COMPONENT_OLE = function Record_SHAPE_COMPONENT_OLE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_OLE";
	// DOC: 2바이트가 아니라 4바이트임
	tmp=this.data.slice(0,4);
	attr._DVASPECT=tmp[0];
	attr.HasMoniker=!!(tmp[1]&0x1);
	// TODO: EqBaseLine: HML에서 어떻게 저장되는지 확인하기
	attr.EqBaseLine=((tmp[1]&0xfe)>>1);
	attr.ObjetType=(tmp[2]&0x3f);if(enum.ObjetType[attr.ObjetType]!==undefined)attr.ObjetType=enum.ObjetType[attr.ObjetType];
	var offset={'value':4};if(attr._DVASPECT & 1) attr.DrawAspect = "Content";
		if(attr._DVASPECT & 2) attr.DrawAspect = "ThumbNail";
		if(attr._DVASPECT & 4) attr.DrawAspect = "Icon";
		if(attr._DVASPECT & 8) attr.DrawAspect = "DocPrint";
	attr.ExtentX=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.ExtentY=this.data.readInt32LE(offset.value); offset.value+=4;
	attr.BinItem=this.data.readUInt16LE(offset.value); offset.value+=2;
	attr.LineShape={};
	// TODO
};
// ??? TODO: 이것들 분류 찾기
root.record.SHAPE_COMPONENT_TEXTART = function Record_SHAPE_COMPONENT_TEXTART(data){
	var tmp,attr=this.attr={};this.data=data;this.name="SHAPE_COMPONENT_TEXTART";
	// TODO
};
// 4.2.10.1.1. 용지 설정
root.record.PAGE_DEF = function Record_PAGE_DEF(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PAGE_DEF";
	attr.Width=this.data.readUInt32LE(0);
	attr.Height=this.data.readUInt32LE(4);
	attr.PageMargin={};
	attr.PageMargin.Left=this.data.readUInt32LE(8);
	attr.PageMargin.Right=this.data.readUInt32LE(12);
	attr.PageMargin.Top=this.data.readUInt32LE(16);
	attr.PageMargin.Bottom=this.data.readUInt32LE(20);
	attr.PageMargin.Header=this.data.readUInt32LE(24);
	attr.PageMargin.Footer=this.data.readUInt32LE(28);
	attr.PageMargin.Gutter=this.data.readUInt32LE(32);
	tmp=this.data.slice(36,40);
	attr.Landscape=(tmp[0]&0x1);
	attr.GutterType=((tmp[0]&0x6)>>1);if(enum.GutterType[attr.GutterType]!==undefined)attr.GutterType=enum.GutterType[attr.GutterType];
};
// 4.2.10.1.2. 각주/미주 모양
root.record.FOOTNOTE_SHAPE = function Record_FOOTNOTE_SHAPE(data){
	var tmp,attr=this.attr={};this.data=data;this.name="FOOTNOTE_SHAPE";
	attr.AutoNumFormat={};
	attr.NoteLine={};
	attr.NoteSpacing={};
	attr.NoteNumbering={};
	attr.NotePlacement={};
	tmp=this.data.slice(0,4);
	attr.AutoNumFormat.Type=tmp[0];if(enum.NumberType2[attr.AutoNumFormat.Type]!==undefined)attr.AutoNumFormat.Type=enum.NumberType2[attr.AutoNumFormat.Type];
	// 각주인지 미주인지에 따라 달라짐!
	attr.NotePlacement.Place=(tmp[1]&0x3);
	attr.NoteNumbering.Type=((tmp[1]&0xc)>>2);if(enum.NoteNumberingType[attr.NoteNumbering.Type]!==undefined)attr.NoteNumbering.Type=enum.NoteNumberingType[attr.NoteNumbering.Type];
	attr.AutoNumFormat.Superscript=!!((tmp[1]&0x10)>>4);
	attr.NotePlacement.BeneathText=!!((tmp[1]&0x20)>>5);
	attr.AutoNumFormat.UserChar=this.data.readUInt16LE(4);if(attr.AutoNumFormat.UserChar)attr.AutoNumFormat.UserChar=String.fromCharCode(attr.AutoNumFormat.UserChar);else attr.AutoNumFormat.UserChar=null;
	attr.AutoNumFormat.PrefixChar=this.data.readUInt16LE(6);if(attr.AutoNumFormat.PrefixChar)attr.AutoNumFormat.PrefixChar=String.fromCharCode(attr.AutoNumFormat.PrefixChar);else attr.AutoNumFormat.PrefixChar=null;
	attr.AutoNumFormat.SuffixChar=this.data.readUInt16LE(8);if(attr.AutoNumFormat.SuffixChar)attr.AutoNumFormat.SuffixChar=String.fromCharCode(attr.AutoNumFormat.SuffixChar);else attr.AutoNumFormat.SuffixChar=null;
	attr.NoteNumbering.NewNumber=this.data.readUInt16LE(10);
	// 문서가 틀림! (16비트가 아니라 32비트)
	// Length가 -1이 될 수도 있는 듯
	attr.NoteLine.Length=this.data.readInt32LE(12);
	attr.NoteSpacing.AboveLine=this.data.readUInt16LE(16);
	attr.NoteSpacing.BelowLine=this.data.readUInt16LE(18);
	attr.NoteSpacing.BetweenNotes=this.data.readUInt16LE(20);
	attr.NoteLine.Type=this.data.readUInt8(22);if(enum.LineType1[attr.NoteLine.Type]!==undefined)attr.NoteLine.Type=enum.LineType1[attr.NoteLine.Type];
	attr.NoteLine.Width=this.data.readUInt8(23);if(enum.LineWidth[attr.NoteLine.Width]!==undefined)attr.NoteLine.Width=enum.LineWidth[attr.NoteLine.Width];
	attr.NoteLine.Color=this.data.readUInt32LE(24);
};
// 4.2.10.1.3. 쪽/테두리 배경
root.record.PAGE_BORDER_FILL = function Record_PAGE_BORDER_FILL(data){
	var tmp,attr=this.attr={};this.data=data;this.name="PAGE_BORDER_FILL";
	tmp=this.data.slice(0,4);
	attr.TextBorder=!!(tmp[0]&0x1);
	attr.HeaderInside=!!((tmp[0]&0x2)>>1);
	attr.FooterInside=!!((tmp[0]&0x4)>>2);
	attr.FillArea=((tmp[0]&0x18)>>3);if(enum.FillAreaType[attr.FillArea]!==undefined)attr.FillArea=enum.FillAreaType[attr.FillArea];
	attr.PageOffset={};
	attr.PageOffset.Left=this.data.readUInt16LE(4);
	attr.PageOffset.Right=this.data.readUInt16LE(6);
	attr.PageOffset.Top=this.data.readUInt16LE(8);
	attr.PageOffset.Bottom=this.data.readUInt16LE(10);
	attr.BorderFill=this.data.readUInt16LE(12);
};
// ???? TODO: 이것들 분류 찾기
root.record.MEMO_LIST = function Record_MEMO_LIST(data){
	var tmp,attr=this.attr={};this.data=data;this.name="MEMO_LIST";
	// TODO
};


root.record.getTree = function getTree(offset, buffer){
	var record, records_flat = [];
	while(offset < buffer.length){
		record = new HWPRawRecord(offset, buffer);
		offset = record._offset;
		records_flat.push(record);
	}

	var prvr = records_flat[0], prv = prvr.resolve(), records = [prv], tmp;
	for(var i=1;i<records_flat.length;i++){
		record = records_flat[i];
		if(record.level == 0){
			prvr = record;
			prv = prvr.resolve();
			records.push(prv);
		}else{
			while(prvr.level >= record.level){
				prvr = prvr.parent;
				tmp = prv.parent;
				delete prv.parent;
				prv = tmp;
				if(!prvr) throw new Error('Invalid record root!');
			}
			tmp = record.resolve(prv);
			prv.children.push(tmp);
			record.parent = prvr;
			tmp.parent = prv;
			
			prvr = record;
			prv = tmp;
		}
	}
	return records;
};