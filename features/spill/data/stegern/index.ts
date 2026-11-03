import { dager1 } from "./dager-1"
import { dager2 } from "./dager-2"
import { dager3 } from "./dager-3"
import { dager4 } from "./dager-4"
import { dager5 } from "./dager-5"
import { dager6 } from "./dager-6"
import { dager7 } from "./dager-7"
import { dager8 } from "./dager-8"
import { dager9 } from "./dager-9"
import { dager10 } from "./dager-10"
import { dager11 } from "./dager-11"
import type { StegernDag } from "./typer"

/** Every day in order from the start date. Add new days at the end so earlier days keep their prompts. */
export const stegernDager: StegernDag[] = [...dager1, ...dager2, ...dager3, ...dager4, ...dager5, ...dager6, ...dager7, ...dager8, ...dager9, ...dager10, ...dager11]
