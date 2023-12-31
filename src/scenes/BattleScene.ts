import { Scene, GameObjects } from "phaser";

import { playClick } from "../utils/audio";
import { useUIStore } from "../stores/ui";
import {
  triggerUINextStep,
  triggerUIExit,
  triggerUIDown,
  triggerUIUp,
  triggerUILeft,
  triggerUIRight,
} from "../utils/ui";
import { useUserDataStore } from "../stores/userData";
import { IPokemon } from "../constants/types";

export default class BattleScene extends Scene {
  trainerBack: GameObjects.Image;
  pokemonFromTeam: GameObjects.Image;

  ennemySprite: GameObjects.Image;
  ennemyPokemon: IPokemon;

  constructor() {
    super("Battle");
  }

  init(data: { pokemon: IPokemon }) {
    this.ennemyPokemon = data.pokemon;
  }

  create(): void {
    this.cameras.main.fadeIn(200);

    // Add base images
    const background = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "battle_background",
    );

    background.displayHeight = Number(this.game.config.height);
    background.scaleX = this.game.scale.canvas.width;
    background.y = Number(this.game.config.height) / 2;
    background.x = Number(this.game.config.width) / 2;

    const grass = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "battle_grass",
    );

    grass.displayHeight = Number(this.game.config.height);
    grass.scaleX = grass.scaleY;
    grass.y = Number(this.game.config.height) / 2;
    grass.x = Number(this.game.config.width) / 2;

    this.trainerBack = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      "trainer_back",
    );

    this.trainerBack.displayHeight = Number(this.game.config.height) / 4;
    this.trainerBack.scaleX = this.trainerBack.scaleY;
    this.trainerBack.y = Number(this.game.config.height) / 1.9;
    this.trainerBack.x = 0;

    this.ennemySprite = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      `pokemon_${this.ennemyPokemon.id}_front${
        this.ennemyPokemon.isShiny ? "_shiny" : ""
      }`,
    );

    this.ennemySprite.displayHeight = Number(this.game.config.height) / 4;
    this.ennemySprite.scaleX = this.ennemySprite.scaleY;
    this.ennemySprite.y = Number(this.game.config.height) / 3.5;
    this.ennemySprite.x = Number(this.game.config.width);
    this.ennemySprite.tint = 0x000000;

    const positionTransitionDelay = 1000;

    // Introduce ennemy and player by sliding them in the area
    this.tweens.add({
      targets: this.trainerBack,
      x: Number(this.game.config.width) / 2.8,
      duration: 1000,
    });

    this.tweens.add({
      targets: this.ennemySprite,
      x: Number(this.game.config.width) / 1.52,
      duration: 1000,
    });

    this.add.existing(background);
    this.add.existing(grass);
    this.add.existing(this.trainerBack);
    this.add.existing(this.ennemySprite);

    // Display UI
    useUIStore.getState().toggleBattle();

    // When sliding is done, show ennemy
    this.time.delayedCall(positionTransitionDelay, () => {
      if (this.ennemySprite) {
        this.ennemySprite.setDepth(99);
        this.ennemySprite.tint = 0xffffff;

        const circle = new Phaser.Geom.Circle(
          this.ennemySprite.x - 15,
          this.ennemySprite.y,
          this.ennemySprite.displayHeight / 2,
        );

        if (this.ennemyPokemon.isShiny) {
          const starsEmitter = this.add.particles(0, 0, "object_star", {
            speed: 0.5,
            lifespan: 1500,
            quantity: 1,
            scale: { start: 0.05, end: 0.03 },
            emitting: false,
            emitZone: {
              type: "edge",
              source: circle,
              quantity: 20,
            },
            duration: 250,
          });

          starsEmitter.start(1);
        }
      }
    });

    const playerGoBackOutOfScreenDelay = positionTransitionDelay + 500;

    // After 1 second, make player go back for him to be able to throw a pokeball
    this.tweens.add({
      targets: this.trainerBack,
      x: -50,
      duration: 1000,
      delay: playerGoBackOutOfScreenDelay,
    });

    const pokeball = this.add.image(
      -50,
      Number(this.game.config.height) / 1.6,
      "object_pokeball",
    );

    pokeball.setScale(2.5);

    this.add.existing(pokeball);

    // Pokeball is thrown
    const pokemonGoInDelay1 = playerGoBackOutOfScreenDelay + 1000;

    this.tweens.add({
      targets: pokeball,
      x: Number(this.game.config.width) / 3,
      y: Number(this.game.config.height) / 1.8,
      duration: 500,
      delay: pokemonGoInDelay1,
      angle: 180,
    });

    // Pokeball fall on the floor
    const pokemonGoInDelay2 = pokemonGoInDelay1 + 500;

    this.tweens.add({
      targets: pokeball,
      x: Number(this.game.config.width) / 3,
      y: Number(this.game.config.height) / 1.5,
      duration: 125,
      delay: pokemonGoInDelay2,
    });

    // Pokemon from pokeball appears
    const userData = useUserDataStore.getState();
    const firstPokemonInTeam = userData.pokemons?.[0]?.id;

    this.pokemonFromTeam = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2,
      `pokemon_${firstPokemonInTeam}_back`,
    );

    this.pokemonFromTeam.displayHeight = Number(this.game.config.height) / 5;
    this.pokemonFromTeam.scaleX = this.pokemonFromTeam.scaleY;
    this.pokemonFromTeam.y = Number(this.game.config.height);
    this.pokemonFromTeam.x = Number(this.game.config.width) / 2.9;

    const pokemonFromTeamAppearsDelay = pokemonGoInDelay2 + 250;

    this.tweens.add({
      targets: this.pokemonFromTeam,
      y: Number(this.game.config.height) / 1.8,
      duration: 250,
      delay: pokemonFromTeamAppearsDelay,
    });

    this.time.delayedCall(pokemonFromTeamAppearsDelay, () => {
      this.listenKeyboardControl();
    });
  }

  listenKeyboardControl(): void {
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => {
      const uiStore = useUIStore.getState();
      const isOpen = uiStore.battle.isOpen;

      switch (event.key.toUpperCase()) {
        case "E":
        case "ENTER":
          if (isOpen) {
            playClick(this);
            triggerUINextStep();
          }

          break;
        case "ESCAPE":
          if (isOpen) {
            playClick(this);
            triggerUIExit();
          }

          break;
        case "ARROWDOWN":
          if (isOpen) {
            playClick(this);
            triggerUIDown();
          }
          break;
        case "ARROWUP":
          if (isOpen) {
            playClick(this);
            triggerUIUp();
          }
          break;
        case "ARROWLEFT":
          if (isOpen) {
            playClick(this);
            triggerUILeft();
          }
          break;
        case "ARROWRIGHT":
          if (isOpen) {
            playClick(this);
            triggerUIRight();
          }
          break;
      }
    });
  }
}
