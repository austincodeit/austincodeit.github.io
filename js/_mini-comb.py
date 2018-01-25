from jsmin import jsmin
import shutil

filesToMinify = ['route-app']

for filename in filesToMinify:
	newName = filename+'2.min.js'
	print newName+" minified..."
	with open(filename+'.js') as js_file:
		f = open(newName,"w+")
		minified = jsmin(js_file.read())
		new = minified.replace('+\n','+')
		f.write(new)
		f.close()


minifiedJs = ['route-app2.min.js']

with open('combined_js2.js','wb') as wfd:
    for files in minifiedJs:
        with open(files,'rb') as fd:
            shutil.copyfileobj(fd, wfd, 1024*1024*10)
