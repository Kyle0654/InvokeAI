import json
import string
from copy import copy
from datetime import datetime, timezone

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
  time: int = int(datetime.now(timezone.utc).timestamp())

  # TODO: use signals/events for progress instead
  progress_callback = None
  image_callback = None
  cancelled_callback = None
  done_callback = None

  def id(self) -> str:
    return f"{self.time}.{self.seed}"

  # TODO: handle this more cleanly
  def data_without_image(self):
    data = copy(self.__dict__)
    data['initimg'] = None
    data['progress_callback'] = None
    data['image_callback'] = None
    data['cancelled_callback'] = None
    data['done_callback'] = None
    return data

  def to_json(self):
    return json.dumps(self.data_without_image())

  @staticmethod
  def from_json(j):
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
    d.gfpgan_strength = float(j.get('gfpgan_strength'))
    d.upscale_level    = j.get('upscale_level')
    d.upscale_strength = j.get('upscale_strength')
    d.upscale = [int(d.upscale_level),float(d.upscale_strength)] if d.upscale_level != '' else None
    d.progress_images = 'progress_images' in j
    d.seed = int(j.get('seed'))
    return d
