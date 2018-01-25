from jsmin import jsmin

filesToMinify = ['str-app','rop-app','route-app','custom-script','load-task-list','print-pdf']

for filename in filesToMinify:
	newName = filename+'.min.js'
	print newName+" minified..."
	with open(filename+'.js') as js_file:
		f = open(newName,"w+")
		minified = jsmin(js_file.read())
		f.write(minified)
		f.close()
