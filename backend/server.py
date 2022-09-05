import transformers
import json
import base64
import mimetypes
import os
import sys
import time
import eventlet
from pytorch_lightning import logging
from flask import Flask, send_from_directory, url_for
from flask_socketio import SocketIO
from ldm.simplet2i import T2I
from ldm.dream.pngwriter import PngWriter
from ldm.gfpgan.gfpgan_tools import gfpgan_model_exists

# static/ is the vite build output dir
app = Flask(__name__, static_url_path='', static_folder='../frontend/dist/')

# serve generated images
app.config['OUTPUTS_FOLDER'] = "../outputs"


@app.route('/outputs/<path:filename>')
def outputs(filename):
    return send_from_directory(
        app.config['OUTPUTS_FOLDER'],
        filename
    )

# serve the UI


@app.route("/", defaults={'path': ''})
def serve(path):
    return send_from_directory(app.static_folder, 'index.html')


host = 'localhost'
port = 9090

# dev (allow all CORS):
socketio = SocketIO(app, cors_allowed_origins="*",
                    logger=True, engineio_logger=True)

# production:
# socketio = SocketIO(app, logger=True, engineio_logger=True)

transformers.logging.set_verbosity_error()

t2i = T2I()

# gets rid of annoying messages about random seed
logging.getLogger('pytorch_lightning').setLevel(logging.ERROR)

tic = time.time()
t2i.load_model()
print(f'>> model loaded in', '%4.2fs' % (time.time() - tic))

print("\n* Initialization done! Ready to dream...")


# cancel in-progress image generation
@socketio.on('cancel')
def handleCancel():
    print('cancel received')


@socketio.on('generateImage')
def handleGenerateImate(data):
    generateImage(data)


def generateImage(data):
    print(data)
    prompt = data['prompt']
    initimg = None
    strength = float(data['img2imgStrength'])
    iterations = int(data['imagesToGenerate'])
    steps = int(data['steps'])
    width = int(data['width'])
    height = int(data['height'])
    fit = False
    initimg = None
    cfgscale = float(data['cfgScale'])
    sampler_name = data['sampler']
    gfpgan_strength = float(data['gfpganStrength']
                            ) if gfpgan_model_exists else 0
    upscale_level = data['upscalingLevel']
    upscale_strength = data['upscalingStrength']
    upscale = [int(upscale_level), float(upscale_strength)
               ] if upscale_level != 0 else None
    progress_images = False
    seed = t2i.seed if int(data['seed']) == -1 else int(data['seed'])
    seed = int(data['seed'])

    pngwriter = PngWriter("./outputs/img-samples/")
    prefix = pngwriter.unique_prefix()

    def image_progress(sample, step):
        socketio.emit('progress', (step+1) / steps)
        eventlet.sleep(0)

    def image_done(image, seed, upscaled=False):
        name = f'{prefix}.{seed}.png'
        path = pngwriter.save_image_and_prompt_to_png(image, f'{prompt} -S{seed}', name)
        # Append post_data to log, but only once!
        if not upscaled:
            socketio.emit('result', {'url': os.path.relpath(path)})
            eventlet.sleep(0)

    t2i.prompt2image(prompt,
                     iterations=iterations,
                     cfg_scale=cfgscale,
                     width=width,
                     height=height,
                     seed=seed,
                     steps=steps,
                     gfpgan_strength=gfpgan_strength,
                     upscale=upscale,
                     sampler_name=sampler_name,
                     step_callback=image_progress,
                     image_callback=image_done)


if __name__ == '__main__':
    socketio.run(app, host=host, port=port)
