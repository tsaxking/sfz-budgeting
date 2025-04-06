<script lang="ts">
	import { Color } from "colors/color";

    interface Props {
        name: string;
        color: string;
        onclick?: () => void;
    }

    const { name, color, onclick }: Props = $props();

    const getTextColor = (color: string) => {
        const black = Color.fromName('black');
        const white = Color.fromName('white');
        const bgColor = new Color(color);
        const contrastBlack = bgColor.detectContrast(black);
        const contrastWhite = bgColor.detectContrast(white);
        return (contrastBlack > contrastWhite ? black : white).toString('rgba');
    }

    const getColor = (color: string) => {
        return new Color(color).setAlpha(0.2).toString('rgba');
    }
</script>

<span class="badge rounded-pill"
style="
    background-color: {getColor(color)};
    border: 1px solid {color};
    color: {color};
"
>
{name}
</span>