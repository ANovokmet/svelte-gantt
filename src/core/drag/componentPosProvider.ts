import { Component } from "../svelte";
import { PositionProvider } from "./interfaces";

export class ComponentPosProvider implements PositionProvider
{
    component: Component;

    constructor(component) {
        this.component = component;
    }

    getPos() {
        const { x, y } = this.component.get();
        return { x, y };
    }

    getWidth() {
        const { currWidth } = this.component.get();
        return currWidth;
    }
}