"""Application module."""
import argparse
import os
import sys
import time
from flask import Flask
from omegaconf import OmegaConf
from ldm.dream.containers import Container, providers
from ldm.dream import views

def create_app(config) -> Flask:
  container = Container()
  container.config.from_dict(config)

  app = Flask(__name__, static_url_path='')
  app.container = container

  # Web Routes
  app.add_url_rule('/', view_func=views.WebIndex.as_view('web_index'))
  app.add_url_rule('/config.js', view_func=views.WebConfig.as_view('web_config'))

  # API Routes
  app.add_url_rule('/api/', view_func=views.ApiIndex.as_view('api_index'))
  app.add_url_rule('/api/cancel', view_func=views.ApiCancel.as_view('api_cancel'))
  app.add_url_rule('/api/images/<string:name>', view_func=views.ApiOutputs.as_view('api_image', 'img-samples'))

  app.static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/dream_web/')) 

  return app

def main():
  """Initialize command-line parsers and the diffusion model"""
  arg_parser = create_argv_parser()
  opt = arg_parser.parse_args()

  if opt.laion400m:
    print('--laion400m flag has been deprecated. Please use --model laion400m instead.')
    sys.exit(-1)
  if opt.weights != 'model':
    print('--weights argument has been deprecated. Please configure ./configs/models.yaml, and call it using --model instead.')
    sys.exit(-1)
      
  try:
    models  = OmegaConf.load(opt.config)
    width   = models[opt.model].width
    height  = models[opt.model].height
    config  = models[opt.model].config
    weights = models[opt.model].weights
  except (FileNotFoundError, IOError, KeyError) as e:
    print(f'{e}. Aborting.')
    sys.exit(-1)

  print('* Initializing, be patient...\n')
  sys.path.append('.')
  from pytorch_lightning import logging
  from ldm.simplet2i import T2I

  # these two lines prevent a horrible warning message from appearing
  # when the frozen CLIP tokenizer is imported
  import transformers

  transformers.logging.set_verbosity_error()

  config = {
    "model": {
      "width": width,
      "height": height,
      "sampler_name": opt.sampler_name,
      "weights": weights,
      "full_precision": opt.full_precision,
      "config": config,
      "grid": opt.grid,
      "latent_diffusion_weights": opt.laion400m,
      "embedding_path": opt.embedding_path,
      "device_type": opt.device
    }
  }

  # make sure the output directory exists
  if not os.path.exists(opt.outdir):
    os.makedirs(opt.outdir)

  # gets rid of annoying messages about random seed
  logging.getLogger('pytorch_lightning').setLevel(logging.ERROR)

  print('\n* starting api server...')
  # Change working directory to the stable-diffusion directory
  os.chdir(
    os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
  )

  # Start server
  flask = create_app(config)

  print(">> Started Stable Diffusion api server!")
  if opt.host == '0.0.0.0':
    print(f"Point your browser at http://localhost:{opt.port} or use the host's DNS name or IP address.")
  else:
    print(">> Default host address now 127.0.0.1 (localhost). Use --host 0.0.0.0 to bind any address.")
    print(f">> Point your browser at http://{opt.host}:{opt.port}.")

  try:
    flask.run(opt.host, opt.port)
  except KeyboardInterrupt:
    pass

SAMPLER_CHOICES=[
  'ddim',
  'k_dpm_2_a',
  'k_dpm_2',
  'k_euler_a',
  'k_euler',
  'k_heun',
  'k_lms',
  'plms',
]

def create_argv_parser():
    parser = argparse.ArgumentParser(
        description="""Generate images using Stable Diffusion.
        Use --web to launch the web interface. 
        Use --from_file to load prompts from a file path or standard input ("-").
        Otherwise you will be dropped into an interactive command prompt (type -h for help.)
        Other command-line arguments are defaults that can usually be overridden
        prompt the command prompt.
"""
    )
    parser.add_argument(
        '--laion400m',
        '--latent_diffusion',
        '-l',
        dest='laion400m',
        action='store_true',
        help='Fallback to the latent diffusion (laion400m) weights and config',
    )
    parser.add_argument(
        '--from_file',
        dest='infile',
        type=str,
        help='If specified, load prompts from this file',
    )
    parser.add_argument(
        '-n',
        '--iterations',
        type=int,
        default=1,
        help='Number of images to generate',
    )
    parser.add_argument(
        '-F',
        '--full_precision',
        dest='full_precision',
        action='store_true',
        help='Use more memory-intensive full precision math for calculations',
    )
    parser.add_argument(
        '-g',
        '--grid',
        action='store_true',
        help='Generate a grid instead of individual images',
    )
    parser.add_argument(
        '-A',
        '-m',
        '--sampler',
        dest='sampler_name',
        choices=SAMPLER_CHOICES,
        metavar='SAMPLER_NAME',
        default='k_lms',
        help=f'Set the initial sampler. Default: k_lms. Supported samplers: {", ".join(SAMPLER_CHOICES)}',
    )
    parser.add_argument(
        '--outdir',
        '-o',
        type=str,
        default='outputs/img-samples',
        help='Directory to save generated images and a log of prompts and seeds. Default: outputs/img-samples',
    )
    parser.add_argument(
        '--embedding_path',
        type=str,
        help='Path to a pre-trained embedding manager checkpoint - can only be set on command line',
    )
    parser.add_argument(
        '--prompt_as_dir',
        '-p',
        action='store_true',
        help='Place images in subdirectories named after the prompt.',
    )
    # GFPGAN related args
    parser.add_argument(
        '--gfpgan_bg_upsampler',
        type=str,
        default='realesrgan',
        help='Background upsampler. Default: realesrgan. Options: realesrgan, none. Only used if --gfpgan is specified',

    )
    parser.add_argument(
        '--gfpgan_bg_tile',
        type=int,
        default=400,
        help='Tile size for background sampler, 0 for no tile during testing. Default: 400.',
    )
    parser.add_argument(
        '--gfpgan_model_path',
        type=str,
        default='experiments/pretrained_models/GFPGANv1.3.pth',
        help='Indicates the path to the GFPGAN model, relative to --gfpgan_dir.',
    )
    parser.add_argument(
        '--gfpgan_dir',
        type=str,
        default='../GFPGAN',
        help='Indicates the directory containing the GFPGAN code.',
    )
    parser.add_argument(
        '--web',
        dest='web',
        action='store_true',
        help='Start in web server mode.',
    )
    parser.add_argument(
        '--api',
        dest='api',
        action='store_true',
        help='Start in API server mode.',
    )
    parser.add_argument(
        '--host',
        type=str,
        default='127.0.0.1',
        help='Web/API server: Host or IP to listen on. Set to 0.0.0.0 to accept traffic from other devices on your network.'
    )
    parser.add_argument(
        '--port',
        type=int,
        default='9090',
        help='Web/API server: Port to listen on'
    )
    parser.add_argument(
        '--weights',
        default='model',
        help='Indicates the Stable Diffusion model to use.',
    )
    parser.add_argument(
        '--device',
        '-d',
        type=str,
        default='cuda',
        help="device to run stable diffusion on. defaults to cuda `torch.cuda.current_device()` if available"
    )
    parser.add_argument(
        '--model',
        default='stable-diffusion-1.4',
        help='Indicates which diffusion model to load. (currently "stable-diffusion-1.4" (default) or "laion400m")',
    )
    parser.add_argument(
        '--config',
        default ='configs/models.yaml',
        help    ='Path to configuration file for alternate models.',
    )
    return parser


if __name__ == '__main__':
  main()