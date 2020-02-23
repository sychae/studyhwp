npm config set scripts-prepend-node-path auto

npm install --g --production windows-build-tools

npm install --g node-

npm rebuild

npm install

npm run dvlp

npm run prod

## LibreOffice 설정
환경변수 path 에 {LibreOffice 설치 폴더}\program  등록

## PDF.js fetch 후 build및 svgjs 처리 
+	비교 git difftool base ./src/display/svg.js
+ [build] pdfjs 폴더에서 > npm run gulp generic
+ pdf2dbook 폴더에서 > _copypdfjs.cmd


## DEBUG
+ npm run dvlp --i {pdf 경로} --o {output 폴더} --skin {skin folder} --config {config file path}

## BUILD
+	npm run build








