export interface DependencyModel {
    id: number;
    /** Id of dependent task */
    fromId: number;
    /** Id of dependency task */
    toId: number;
    /** Stroke color */
    stroke: string;
    /** Width of stroke */
    strokeWidth: number;
    /** Size of the arrow head */
    arrowSize: number;
}
