export const AlertContainer = md => {
    return {
        validate: params => {
            return params.trim().match(/^alert\s+(.*)$/);
        },
        render: (tokens, idx) => {
            const m = tokens[ idx ].info.trim().match(/^alert\s+(.*)$/);

            if (1 === tokens[ idx ].nesting) {
                // opening tag
                return `<div class="alert alert-${md.utils.escapeHtml(m[ 1 ])}">\n`;
            }

            // closing tag
            return '</div>\n';
        },
    };
};
