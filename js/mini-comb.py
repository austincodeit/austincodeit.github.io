from jsmin import jsmin
import shutil

#filesToMinify = ['route-app','custom-script','load-task-list','print-pdf','route-to-mobile']
filesToMinify = ['route_refactor','custom-script']

for filename in filesToMinify:
	newName = filename+'.min.js'
	print newName+" minified..."
	with open(filename+'.js') as js_file:
		f = open(newName,"w+")
		minified = jsmin(js_file.read())
		new = minified.replace('+\n','+')
		f.write(new)
		f.close()


#minifiedJs = ['route-app.min.js','custom-script.min.js','load-task-list.min.js','print-pdf.min.js','route-to-mobile.min.js']
minifiedJs = ['route_refactor.min.js', 'custom-script.min.js']

#with open('acd_bundle.min.js','wb') as wfd:
with open('acd_bundle_v2.min.js','wb') as wfd:
    for files in minifiedJs:
        with open(files,'rb') as fd:
            shutil.copyfileobj(fd, wfd, 1024*1024*10)
