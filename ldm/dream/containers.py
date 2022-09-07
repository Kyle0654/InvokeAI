"""Containers module."""

from dependency_injector import containers, providers
from ldm.dream import services
from ldm.simplet2i import T2I

class Container(containers.DeclarativeContainer):
  wiring_config = containers.WiringConfiguration(modules=["ldm.dream.views"])

  config = providers.Configuration()

  model_singleton = providers.Singleton(
    T2I,
    width = config.model.width,
    height = config.model.height,
    sampler_name = config.model.sampler_name,
    weights = config.model.weights,
    full_precision = config.model.full_precision,
    config = config.model.config,
    grid = config.model.grid,
    latent_diffusion_weights = config.model.latent_diffusion_weights,
    embedding_path = config.model.embedding_path,
    device_type = config.model.device_type
  )

  generator_service = providers.Singleton(
    services.GeneratorService,
    model = model_singleton
  )
