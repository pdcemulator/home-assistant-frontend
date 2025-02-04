import { mdiPlus } from "@mdi/js";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, state } from "lit/decorators";
import { classMap } from "lit/directives/class-map";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeRTL } from "../../../common/util/compute_rtl";
import type {
  LovelaceViewConfig,
  LovelaceViewElement,
} from "../../../data/lovelace";
import type { HomeAssistant } from "../../../types";
import { HuiErrorCard } from "../cards/hui-error-card";
import { HuiCardOptions } from "../components/hui-card-options";
import type { Lovelace, LovelaceCard } from "../types";

export class SideBarView extends LitElement implements LovelaceViewElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lovelace?: Lovelace;

  @property({ type: Number }) public index?: number;

  @property({ type: Boolean }) public isStrategy = false;

  @property({ attribute: false }) public cards: Array<
    LovelaceCard | HuiErrorCard
  > = [];

  @state() private _config?: LovelaceViewConfig;

  public setConfig(config: LovelaceViewConfig): void {
    this._config = config;
  }

  public willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);

    if (this.lovelace?.editMode) {
      import("./default-view-editable");
    }

    if (changedProperties.has("cards")) {
      this._createCards();
    }

    if (!changedProperties.has("lovelace")) {
      return;
    }

    const oldLovelace = changedProperties.get("lovelace") as
      | Lovelace
      | undefined;

    if (
      (!changedProperties.has("cards") &&
        oldLovelace?.config !== this.lovelace?.config) ||
      (oldLovelace && oldLovelace?.editMode !== this.lovelace?.editMode)
    ) {
      this._createCards();
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class="container"></div>
      ${this.lovelace?.editMode
        ? html`
            <ha-fab
              .label=${this.hass!.localize(
                "ui.panel.lovelace.editor.edit_card.add"
              )}
              extended
              @click=${this._addCard}
              class=${classMap({
                rtl: computeRTL(this.hass!),
              })}
            >
              <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
            </ha-fab>
          `
        : ""}
    `;
  }

  private _addCard(): void {
    fireEvent(this, "ll-create-card");
  }

  private _createCards(): void {
    const mainDiv = document.createElement("div");
    mainDiv.id = "main";
    const sidebarDiv = document.createElement("div");
    sidebarDiv.id = "sidebar";

    if (this.hasUpdated) {
      const oldMain = this.renderRoot.querySelector("#main");
      const oldSidebar = this.renderRoot.querySelector("#sidebar");
      const container = this.renderRoot.querySelector(".container")!;
      if (oldMain) {
        container.removeChild(oldMain);
      }
      if (oldSidebar) {
        container.removeChild(oldSidebar);
      }
      container.appendChild(mainDiv);
      container.appendChild(sidebarDiv);
    } else {
      this.updateComplete.then(() => {
        const container = this.renderRoot.querySelector(".container")!;
        container.appendChild(mainDiv);
        container.appendChild(sidebarDiv);
      });
    }

    this.cards.forEach((card: LovelaceCard, idx) => {
      const cardConfig = this._config?.cards?.[idx];
      let element: LovelaceCard | HuiCardOptions;
      if (this.isStrategy || !this.lovelace?.editMode) {
        card.editMode = false;
        element = card;
      } else {
        element = document.createElement("hui-card-options");
        element.hass = this.hass;
        element.lovelace = this.lovelace;
        element.path = [this.index!, idx];
        card.editMode = true;
        element.appendChild(card);
      }
      if (cardConfig?.view_layout?.position !== "sidebar") {
        mainDiv.appendChild(element);
      } else {
        sidebarDiv.appendChild(element);
      }
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        padding-top: 4px;
        height: 100%;
        box-sizing: border-box;
      }

      .container {
        display: flex;
        justify-content: center;
        margin-left: 4px;
        margin-right: 4px;
      }

      #main {
        max-width: 1620px;
        flex-grow: 2;
      }

      #sidebar {
        flex-grow: 1;
        max-width: 380px;
      }

      .container > div {
        min-width: 0;
        box-sizing: border-box;
      }

      .container > div > * {
        display: block;
        margin: var(--masonry-view-card-margin, 4px 4px 8px);
      }

      @media (max-width: 760px) {
        .container {
          flex-direction: column;
        }
        #sidebar {
          max-width: unset;
        }
      }

      @media (max-width: 500px) {
        .container > div > * {
          margin-left: 0;
          margin-right: 0;
        }
      }

      ha-fab {
        position: sticky;
        float: right;
        right: calc(16px + env(safe-area-inset-right));
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index: 1;
      }

      ha-fab.rtl {
        float: left;
        right: auto;
        left: calc(16px + env(safe-area-inset-left));
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-sidebar-view": SideBarView;
  }
}

customElements.define("hui-sidebar-view", SideBarView);
