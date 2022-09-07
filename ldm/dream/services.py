import time
from ldm.simplet2i import T2I

class GeneratorService:
  __model: T2I

  def __init__(self, model: T2I):
    self.__model = model
    
    # preload the model
    tic = time.time()
    self.__model.load_model()
    print(
      f'>> model loaded in', '%4.2fs' % (time.time() - tic)
    )

  def model(self):
    return self.__model

  def hello(self):
    return "hello world"