import os
import bpy
import json

import sys
argv = sys.argv
argv = argv[argv.index("--") + 1:]

jobId = argv[0]

bpy.ops.object.select_all(action='DESELECT')
bpy.data.objects['Cube'].select = True
bpy.data.objects['Camera'].select = True
bpy.ops.object.delete()


path = os.path.dirname(os.path.realpath(__file__))

blendfile = path + "/repository.blend"

jobData = json.load(open('./temp/renderJob_' + jobId + '.json'))

placedTiles = jobData

for placedTile in placedTiles :
    if placedTile['type'] == 'tile' :
        if 'model' in placedTile['properties'] :
            bpy.ops.wm.link_append(directory = blendfile + "\\Object\\", link=False, filename=placedTile['properties']['model'])
            bpy.data.objects[placedTile['properties']['model']].name = placedTile['name']
            bpy.data.objects[placedTile['name']].location = (placedTile['x'] / 32, (placedTile['y'] / 32) * -1, 0)
    if placedTile['type'] == 'stuff' :
        if 'model' in placedTile['properties'] :
            bpy.ops.wm.link_append(directory = blendfile + "\\Object\\", link=False, filename=placedTile['properties']['model'])
            bpy.data.objects[placedTile['properties']['model']].name = placedTile['name']
            bpy.data.objects[placedTile['name']].location = (placedTile['x'] / 32, (placedTile['y'] / 32) * -1, 0)
    if placedTile['type'] == 'target' :
        target = bpy.data.objects.new(placedTile['name'], None)
        bpy.context.scene.objects.link(target)
        target.location = (placedTile['x'] / 32, (placedTile['y'] / 32) * -1, int(placedTile['properties']['z']) / 32)

for placedTile in placedTiles :
    if placedTile['type'] == 'camera' :
        cam = bpy.data.cameras.new('Camera')
        cam_ob = bpy.data.objects.new(placedTile['name'], cam)
        bpy.context.scene.objects.link(cam_ob)
        cam_ob.location = (placedTile['x'] / 32, (placedTile['y'] / 32) * -1, int(placedTile['properties']['z']) / 32)

        if 'target' in placedTile['properties'] :
            if bpy.data.objects.get(placedTile['properties']['target']) is not None:
                ttc = cam_ob.constraints.new(type='TRACK_TO')
                ttc.target = bpy.data.objects.get(placedTile['properties']['target'])
                ttc.track_axis = 'TRACK_NEGATIVE_Z'
                ttc.up_axis = 'UP_Y'

renderedImages = []

for obj in bpy.data.objects:
    if ( obj.type =='CAMERA') :
        bpy.context.scene.camera = obj
        bpy.context.scene.render.filepath = '//temp/' + jobId + '_' + obj.name
        renderedImages.append(jobId + '_' + obj.name + '.png')
        bpy.ops.render.render( write_still=True )

with open('./temp/renderJob_' + jobId + '_result.json', 'w') as outfile:
    json.dump(renderedImages, outfile)
