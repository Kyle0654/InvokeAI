import json
import string

class DreamRequest():
  prompt: string
  initimg: string
  strength: float
  iterations: int
  steps: int
  width: int
  height: int
  fit = None
  cfgscale: float
  sampler_name: string
  gfpgan_strength: float
  upscale_level: int
  upscale_strength: float
  upscale: None
  progress_images = None
  seed: int

  def to_json(self):
    return json.dumps(self.__dict__)

  @staticmethod
  def from_json(j, model):
    # unfortunately this import can't be at the top level, since that would cause a circular import
    from ldm.gfpgan.gfpgan_tools import gfpgan_model_exists

    d = DreamRequest()
    d.prompt = j.get('prompt')
    d.initimg = j.get('initimg')
    d.strength = float(j.get('strength'))
    d.iterations = int(j.get('iterations'))
    d.steps = int(j.get('steps'))
    d.width = int(j.get('width'))
    d.height = int(j.get('height'))
    d.fit    = 'fit' in j
    d.cfgscale = float(j.get('cfgscale'))
    d.sampler_name  = j.get('sampler')
    d.gfpgan_strength = float(j.get('gfpgan_strength')) if gfpgan_model_exists else 0
    d.upscale_level    = j.get('upscale_level')
    d.upscale_strength = j.get('upscale_strength')
    d.upscale = [int(d.upscale_level),float(d.upscale_strength)] if d.upscale_level != '' else None
    d.progress_images = 'progress_images' in j
    d.seed = model.seed if int(j.get('seed')) == -1 else int(j.get('seed'))
    return d
