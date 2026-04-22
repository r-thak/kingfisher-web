import React from "react";
import { Card, Button, Icon, Label } from "semantic-ui-react";

const PromoCard = React.forwardRef(({ title, description, link, dateAdded }, ref) => {
  const isNew = dateAdded
    ? (() => {
        const addedDate = new Date(dateAdded);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return addedDate > sixMonthsAgo;
      })()
    : false;

  return (
    <div ref={ref}>
      <Card fluid raised className="PromoCard">
        <Card.Content>
          <Card.Header>
            {title}
            {isNew && (
              <Label
                color="red"
                size="mini"
                style={{ marginLeft: "8px", verticalAlign: "middle" }}
              >
                New!
              </Label>
            )}
          </Card.Header>
          <Card.Description>{description}</Card.Description>
        </Card.Content>
        <Button
          as="a"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          attached="bottom"
          secondary
        >
          <Icon name="external alternate" />
          Visit {title}
        </Button>
      </Card>
    </div>
  );
});

export default PromoCard;
