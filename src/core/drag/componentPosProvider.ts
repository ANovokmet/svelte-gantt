import { Component } from "../svelte";
import { PositionProvider } from "./interfaces";

export class ComponentPosProvider implements PositionProvider
{
    component: Component;

    constructor(component) {
        this.component = component;
    }

    getPos() {
        const { posX, posY } = this.component.get();
        return { posX, posY };
    }

    getWidth() {
        const { widthT } = this.component.get();
        return widthT;
    }
}